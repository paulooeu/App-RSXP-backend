"use strict";

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use("Factory");

Factory.blueprint("App/Models/User", (faker, i, data = {}) => {
  return {
    name: faker.name(),
    email: faker.email(),
    password: faker.string(),
    ...data
  };
});
