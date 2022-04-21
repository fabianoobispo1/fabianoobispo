import { Client } from 'faunadb'


if (!process.env.FAUNADB_KEY) {
    throw new Error("`FAUNADB_KEY` must be provided in the `.env` file");
  }
  
  export const fauna = new Client({ secret: process.env.FAUNADB_KEY });