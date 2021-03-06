import { Constants, Location, Permissions } from 'expo';
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import moment from 'moment';

import CircleButton from '../elements/CircleButton';
import EventList from '../components/EventList';
import EventMap from '../components/EventMap';

import ENV from '../../env.json';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  inputField: {
    width: '100%',
    height: 58,
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  input: {
    backgroundColor: '#eee',
    width: '10%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginTop: 10,
    marginLeft: 10,
  },
  buttonContainer: {
    width: '10%',
    marginTop: 5,
    alignItems: 'center',
  },
});

class EventListScreen extends React.Component {
  state = {
    eventList: [],
    inputs: {
      distance: 2,
      from: 2,
    },
    location: {
      allowed: false,
      data: null,
    },
  }

  componentWillMount() {
    this.fetchLocation();
  }

  fetchLocation() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      console.log("if (Platform.OS === 'android' && !Constants.isDevice)");
      this.setState({
        location: {
          allowed: false,
          data: null,
        },
      });
    } else {
      Permissions.askAsync(Permissions.LOCATION)
        .then((status) => {
          console.log('Permissions.askAsync(Permissions.LOCATION)');
          console.log(status);
          if (status !== 'granted') {
            this.setState({
              location: {
                allowed: false,
                data: null,
              },
            });
          }
          return Location.getCurrentPositionAsync({});
        })
        .then((location) => {
          console.log(location);
          this.setState({
            location: {
              allowed: true,
              data: location,
            },
          });
          this.fetchEvents();
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  fetchEvents() {
    console.log('fetchEvents()');
    console.log(this.state);
    if (this.state.location.allowed) {
      fetch(`${ENV.API_HOST}/api/events/nearby?q[lat]=${this.state.location.data.coords.latitude}&q[long]=${this.state.location.data.coords.longitude}&q[distance]=${this.state.inputs.distance || 5}&q[from]=${this.state.inputs.from || 2}`)
        .then((response) => {
          console.log(`${ENV.API_HOST}/api/events/nearby?q[lat]=35.681167&q[long]=139.767052&q[distance]=${this.state.inputs.distance || 5}&q[from]=${this.state.inputs.from || 2}`);
          console.log(response);
          return response.json();
        })
        .then((responseJson) => {
          return responseJson.events.map((event) => {
            return {
              key: event.id,
              artistName: event.player.name,
              date: moment.unix(event.start_at).format('YYYY/MM/DD HH:mm'),
              venueName: event.address.name,
              title: event.title,
              url: event.url,
              latlng: {
                latitude: event.address.latitude,
                longitude: event.address.longitude,
              }
            };
          });
        })
        .then((eventList) => {
          console.log(eventList);
          this.setState({ eventList });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      this.setState({ eventList: [] });
    }
  }

  render() {
    return (
      <View style={styles.container} >
        <EventMap
          location={this.state.location}
          distance={this.state.inputs.distance}
          events={this.state.eventList}
        />

        <View style={styles.inputField} >
          <TextInput
            style={styles.input}
            value={this.state.inputs.distance}
            onChangeText={(text) => { this.setState({ inputs: { distance: text } }); }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Distance"
            underlineColorAndroid="transparent"
          />
          <Text>km</Text>
          <TextInput
            style={styles.input}
            value={this.state.inputs.from}
            onChangeText={(text) => { this.setState({ inputs: { from: text } }); }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="days from"
            underlineColorAndroid="transparent"
          />
          <Text>days from now</Text>

          <View style={styles.buttonContainer} >
            <CircleButton
              iconName="refresh"
              onPress={() => { this.fetchLocation(); }}
            />
          </View>
        </View>

        <EventList events={this.state.eventList} />
      </View>
    );
  }
}

export default EventListScreen;
