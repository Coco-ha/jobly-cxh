"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("fails if not admin", async function () {

    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("works for admins", async function () {

    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ company: newCompany });
  });

  test("bad request with missing data", async function () {

    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })

      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual(
        [
          {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
          {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
          {
            handle: "c3",
            name: "C3",
            description: "Desc3",
            numEmployees: 3,
            logoUrl: "http://c3.img",
          },
        ]);
  });

  test("Works for users", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c2"
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      }
    ]);

  });

  test("Works for admins", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c2"
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      }
    ]);

  });

  test("gets correct companies with all params", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c2",
        minEmployees: 1,
        maxEmployees: 3
      });

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      }
    ]);

  });

  test("gets correct companies with only name param", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c3"
      });

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      }
    ]);
  });

  test("gets correct companies with minEmployees", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c1",
        minEmployees: 3
      });

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([]);

  });

  test("fails if inputs are invalid", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c1",
        minEmployees: 3,
        maxEmployees: 200,
        color: "blue"

      });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"color\""
        ],
        "status": 400
      }
    });

  });

  test("gets multiple companies correctly", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c",
        minEmployees: 2,
        maxEmployees: 3
      });

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img"
      }
    ]);

  });

  test("throws error if min and max are invalid", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c",
        minEmployees: 3,
        maxEmployees: 1
      });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error).toEqual({
      "message": "Bad Request",
      "status": 400
    });

  });

  test("throws error if inputs are invalid", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c",
        minEmployees: "textBad"
      });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error).toEqual({
      "message": [
        "instance.minEmployees is not of a type(s) integer"
      ],
      "status": 400
    });

  });

  test("fails if there are extra inputs", async function () {

    const resp = await request(app).get("/companies")
      .query({
        name: "c",
        minEmployees: 1,
        maxEmployees: 3,
        color: "blue"
      });

    expect(resp.statusCode).toEqual(400);

  });

});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {

  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });
  // TODO: unauth
    test("unauth if not admin", async function () {

      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);

      expect(resp.statusCode).toEqual(401);

    });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {

    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })

      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {

    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })

      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {

    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })

      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

// TODO: Test that unauth request with bad data is throwing the correct error
// Application-wide
describe("DELETE /companies/:handle", function () {

  test("works for admins", async function () {

    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("fails if not admin", async function () {

    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {

    const resp = await request(app)
      .delete(`/companies/c1`);

    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {

    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});
