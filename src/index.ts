import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entity/User";
import { GraphQLServer } from "graphql-yoga";
import { ResolverMap } from "./types/resolverType";
import { Profile } from "./entity/Profile";

const typeDefs = `
type Profile {
    id: Int!
    gender: String!
}

type User {
    id: Int!
    firstName: String!
    profile: Profile
    profileId: Int!
}
 
type Query {
    hello(name: String): String!
    user(id: Int!): User!
    users: [User!]!
}

input ProfileInput {
    gender: String!
}

type Mutation {
    createUser(firstName: String!, profile: ProfileInput!): User!
    updateUser(id: Int!, firstName: String): Boolean 
    deleteUser(id: Int!): Boolean
}
`;

const resolvers: ResolverMap = {
  Query: {
    hello: (_: any, { name }: any) => `Hello ${name || "MilkyWay"}`,
    user: async (_, { id }) => {
      const user = await User.findOne({ id }, { relations: ["profile"] });
      if (user) console.log(user);
      return user;
    },
    users: () => User.find({ relations: ["profile"] })
  },
  Mutation: {
    createUser: async (
      _,
      args: { firstName: string; profile: { gender: string } }
    ) => {
      try {
        const profile = Profile.create(args.profile);
        await Profile.save(profile);
        const user = User.create({
          firstName: args.firstName,
          profileId: profile.id
        });
        await User.save(user);

        return {
          ...user,
          profile
        };
      } catch (err) {
        console.log(err.message);
        return false;
      }
    },
    updateUser: (_, { id, ...args }) => {
      try {
        User.update({ id }, args);
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
    deleteUser: (_, { id }) => {
      try {
        User.delete({ id });
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  }
};

const server = new GraphQLServer({ typeDefs, resolvers });

createConnection()
  .then(() => {
    server.start(() =>
      console.log("Server is running on http://localhost:4000")
    );
  })
  .catch((error) => console.log(error));
