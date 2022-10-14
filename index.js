const {GraphQLServer, PubSub, withFilter} = require('graphql-yoga');
const { nanoid } = require('nanoid');
const { events, locations, users, participants } = require("./data.json");

const typeDefs =`
############################ Event
type Event{
    id: ID!
    title: String!
    desc: String!
    date:String!
    from:String!
    to:String!
    location_id:ID
    user_id:ID
    user:User!
    location:Location!
    participants:[Participant!]!
}

input CreateEventInput{
    title: String!
    desc: String!
    date:String!
    from:String!
    to:String!
    location_id:ID
    user_id:ID
}

input UpdateEventInput{
    title: String
    desc: String
    date:String
    from:String
    to:String
    location_id:ID
    user_id:ID
}
############################ Location
type Location{
    id: ID!
    name:String!
    desc:String!
    lat:Float!
    lng:Float!
    events:[Event!]!
}

input CreateLocationInput{
    name:String!
    desc:String!
    lat:Float!
    lng:Float!
}

input UpdateLocationInput{
    name:String
    desc:String
    lat:Float
    lng:Float
}

############################ User
type User{
    id:ID!
    username:String!
    email:String!
    events:[Event!]!
    participants:[Participant!]!
}
input CreateUserInput{
    username:String!
    email:String!
}

input UpdateUserInput{
    username:String
    email:String
}

############################ Participant
type Participant{
    id:ID!
    user_id: ID!
    event_id: ID!
    user:User!
    event:Event!
}
input CreateParticipantInput{
    user_id: ID!
    event_id:ID!
}

input UpdateParticipantInput{
    user_id:ID
    event_id:ID
}

type DeleteAllOutput{
    count:Int!
}

############################ QUERY

type Query{
    events:[Event]!
    event(id:ID!):Event!

    locations:[Location!]!
    location(id:ID!):Location!

    users:[User!]!
    user(id:ID!):User!

    participants:[Participant!]!
    participant(id:ID!):Participant!
}



############################ Mutation

type Mutation{
    createUser(data: CreateUserInput!): User!
    updateUser(id: ID!, data: UpdateUserInput!): User!
    deleteUser(id: ID!):User!
    deleteAllUsers: DeleteAllOutput!

    createLocation(data: CreateLocationInput!): Location!
    updateLocation(id:ID!, data: UpdateLocationInput!): Location!
    deleteLocation(id:ID!): Location!
    deleteAllLocations: DeleteAllOutput!

    createEvent(data: CreateEventInput!): Event!
    updateEvent(id:ID!, data:UpdateEventInput!):Event!
    deleteEvent(id:ID!):Event!
    deleteAllEvents: DeleteAllOutput!

    createParticipant(data:CreateParticipantInput!): Participant!
    updateParticipant(id:ID!, data:UpdateParticipantInput!): Participant!
    deleteParticipant(id:ID!): Participant!
    deleteAllParticipants: DeleteAllOutput!
}

    type Subscription{
        userCreated : User!
    
        eventCreated(user_id: ID): Event!
    
        participantAdded(user_id: ID): Participant!
    }
`;

const resolvers = {
    Subscription: {
        userCreated :{
            subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('userCreated')
            },
        eventCreated: {
            subscribe: withFilter(
                (_, __, {pubsub}) => pubsub.asyncIterator('eventCreated'),
                (payload, variables) => {
                    return variables.user_id ? payload.eventCreated.user_id === variables.user_id : true;
                }
            )
        },
        participantAdded: {
            subscribe: withFilter(
                (_, __, {pubsub}) => pubsub.asyncIterator('participantAdded'),
                (payload, variables) => {
                    return variables.user_id ? payload.participantAdded.user_id === variables.user_id : true;
                }
            )
        }
    },
    Mutation: {
        //USER
        createUser: (parent, { data }, {pubsub}) => {
            const user = {
                id: nanoid(),
                ...data
            }
            users.push(user)
            pubsub.publish('userCreated', {userCreated: user})
            return user;
        
        },
        updateUser: (parent, {id, data}) => {
            const user_index = users.findIndex(user => user.id == id)
            if(user_index === -1){
                throw new Error("User not found");
            }
            const updated_users= users[user_index]= {
                ...users[user_index],
                ...data,
            }
            return updated_users;
        },
        deleteUser: (parent, { id }) => {
            const user_index = users.findIndex(user => user.id == id);
            if (user_index === -1) {
                throw new Error('User Not Found!')
            }
            const deleted_user = users[user_index];
            users.splice(user_index, 1);
            return deleted_user;
        },
        deleteAllUsers:() => {
            const length = users.length;
            users.splice(0, length);

            return {
                count: length,
            }
        },
        //Location
        createLocation:(parent, {data}) => {
            const location = {
                id: nanoid(),
                ...data
            }
            locations.push(location)
            return location;
        },
        updateLocation: (parent, {id, data}) => {
            const location_index = locations.findIndex(location => location.id == id)
            if(location_index === -1){
                throw new Error("Location not found");
            }
            const updated_locations= locations[location_index]= {
                ...locations[location_index],
                ...data,
            }
            return updated_locations;
        },
        deleteLocation: (parent, { id }) => {
            const location_index = locations.findIndex(location => location.id == id);

            if (location_index === -1) {
                throw new Error('location Not Found!')
            }

            const deleted_location = locations[location_index];
            locations.splice(location_index, 1);
            return deleted_location;
        },
        deleteAllLocations:() => {
            const length = locations.length;
            locations.splice(0, length);

            return {
                count: length,
            }
        },
        //Participant
        createParticipant:(parent, {data}, {pubsub}) => {
            const participant = {
                id: nanoid(),
                ...data
            }
            participants.push(participant)
            pubsub.publish('participantAdded', {participantAdded: participant});
            return participant;
        },
        updateParticipant: (parent, {id, data}) => {
            const participant_index = participants.findIndex(participant => participant.id == id)
            if(participant_index === -1){
                throw new Error("participant not found");
            }
            const updated_participants= participants[participant_index]= {
                ...participants[participant_index],
                ...data,
            }
            return updated_participants;
        },
        deleteParticipant: (parent, { id }) => {
            const participant_index = participants.findIndex(participant => participant.id == id);

            if (participant_index === -1) {
                throw new Error('participant Not Found!')
            }

            const deleted_participant = participants[participant_index];
            locations.splice(location_index, 1);
            return deleted_participant;
        },
        deleteAllParticipants:() => {
            const length = participants.length;
            participants.splice(0, length);

            return {
                count: length,
            }
        },
        //Event
        createEvent:(parent, {data}, {pubsub}) => {
            const event = {
                id: nanoid(),
                ...data
            }
            events.push(event)
            pubsub.publish('eventCreated', {eventCreated: event});
            return event;
        },
        updateEvent: (parent, {id, data}) => {
            const event_index = events.findIndex(event => event.id == id)
            if(location_index === -1){
                throw new Error("Event not found");
            }
            const updated_events= events[event_index]= {
                ...events[event_index],
                ...data,
            }
            return updated_events;
        },
        deleteEvent: (parent, { id }) => {
            const event_index = events.findIndex(event => event.id == id);

            if (event_index === -1) {
                throw new Error('event Not Found!')
            }

            const deleted_event = events[event_index];
            locations.splice(location_index, 1);
            return deleted_event;
        },
        deleteAllEvents:() => {
            const length = events.length;
            events.splice(0, length);

            return {
                count: length,
            }
        },
    },

    Query: {
        events: () => events,
        event: (parent, args) => events.find((event) => event.id == args.id),

        locations: () => locations,
        location: (parent, args) => locations.find((location) => location.id == args.id),

        users: () => users,
        user: (parent, args) => users.find((user) => user.id == args.id),

        participants: () => participants,
        participant: (parent, args) => participants.find((participant) => participant.id == args.id),
    },
    User: {
        events: (parent, args) => events.filter((event) => event.user_id == parent.id),
        participants: (parent, args) => participants.filter((participant) => participant.user_id == parent.id),
    },
    Event: {
        user: (parent, args) => users.find((user) => user.id == parent.user_id),
        location: (parent) => locations.find((location) => location.id == parent.location_id),
        participants: (parent) => participants.filter((participant) => participant.event_id == parent.id),
    },
    Participant: {
        user: (parent) => users.find((user) => user.id == parent.user_id),
        event: (parent) => events.find((event) => event.id == parent.event_id),
    },
    Location: {
        events: (parent) => events.filter((event => event.location_id == parent.id)),
    }
};

const pubsub = new PubSub();

const server = new GraphQLServer(
    {typeDefs, resolvers, context: {pubsub}});
  
  server.start(() => console.log(`🚀  Server ready at 4000}`));