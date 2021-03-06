"use strict";
// test router '/users' and '/authentications'
const request = require("request");
const configs = require("./configs.json");
const assert = require("assert");
const util = require("util");
const jwt = require("jsonwebtoken");
const moment = require("moment");

// configs
const routerPrefix = "/users";
const authentications = "/authentications";
const protocol = configs.app.protocol;
const host = configs.app.host;
const port = configs.app.port;
const cert = configs.jwt.cert;

describe("Test the /users", function () {
    // group of root
    let root = {
        id: -1,
        username: "",
        password: "",
		penName: "",
        groupName: "",
        token: ""
    };

    // group of author
    let temp = {
        id: -1,
        username: "!@#$%^&*()",
        password: "!@#$%^&*()",
        penName: "!@#$%^&*()",
        groupName: "author",
        token: ""
    };

    // some temp token
    let outOfDateToken = "";
    let doNotExistsToken = "";

    it("get root user must be ok", function (done) {
        assert.deepStrictEqual(configs.users.root.length >= 1, true, "root users's length must >= 1");
        root.username = configs.users.root[0].username;
        root.password = configs.users.root[0].password;
        root.id = configs.users.root[0].id;
		root.groupName = "root";
		root.penName = configs.users.root[0].penName;
        done();
    });

    it("root account log in (get token) with right username and password must be ok", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, authentications),
            form: {
                username: root.username,
                password: root.password
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            root.token = JSON.parse(body).token;
            assert.strictEqual(typeof root.token, "string");
            done();
        });
    });

    // 1004
    it("log in (get token) with wrong username and password must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, authentications),
            form: {
                username: root.username,
                password: ""
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1004)
            done();
        });
    });

    it("create a user by right token and has all needs info must be ok", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: temp.username,
                password: temp.password,
                penName: temp.penName,
                groupName: temp.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            temp.id = JSON.parse(body).userId;
            assert.strictEqual(typeof temp.id, "number");
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            done();
        });
    });

    // 2000
    it("create a user without username must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                password: temp.password,
                penName: temp.penName,
                groupName: temp.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
            assert.strictEqual(JSON.parse(body).errorCode, 2000);
            done();
        });
    });

    // 2000
    it("create a user without penName must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: temp.username,
                password: temp.password,
                groupName: temp.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
            assert.strictEqual(JSON.parse(body).errorCode, 2000);
            done();
        });
    });

    // 2000
    it("create a user without password must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: temp.username,
                penName: temp.penName,
                groupName: temp.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
            assert.strictEqual(JSON.parse(body).errorCode, 2000);
            done();
        });
    });

    // 2000
    it("create a user without groupName must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: temp.username,
                penName: temp.penName,
                password: temp.password
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
            assert.strictEqual(JSON.parse(body).errorCode, 2000);
            done();
        });
    });

	// 2001
    it("create user (use root account) but username exist must be failed", function (done) {
		request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: root.username,
                password: root.password,
                penName: ":>?:{>?>",
                groupName: root.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2001);
			done();
        });
	});

	// 2002
	it("create user (use root account) but penName exist must be failed", function (done) {
		request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: "123123()(())(()",
                password: root.password,
                penName: root.penName,
                groupName: root.groupName
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2002);
			done();
        });
	});

	// 2003
	it("create user (use root account) but group don't exists must be failed", function (done) {
		request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            form: {
                username: "123123()(())(()",
                password: root.password,
                penName: "123sgfsdfgaeaweafd",
                groupName: "nmb"
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2003);
			done();
        });
	});

	// 2006
	it("update a temp account's username when username is void must be failed", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id),
            form: {
                username: ""
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2006);
			done();
        });
	});

    // 2006
    it("update temp account's penName when penName is void must be failed", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id),
            form: {
                penName: ""
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2006);
			done();
        });
	});

    // 2006
    it("update temp account's password when password is void must be failed", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id),
            form: {
                password: ""
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
			assert.strictEqual(JSON.parse(body).errorCode, 2006);
			done();
        });
	});

    it("update root account's introduce must be ok", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + root.id),
            form: {
                introduce: "update root account's introduce must be ok"
            },
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
			done();
        });
	});

    // 1001
    it("create user with wrong token must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            headers: {
                Authorization: "jwt " + "wrongtoken"
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1001);
            done();
        });
    });

    it("temp account log in (get token) must be ok", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, authentications),
            form: {
                username: temp.username,
                password: temp.password
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            temp.token = JSON.parse(body).token;
            assert.strictEqual(typeof temp.token, "string");
            done();
        });
    });

    // 1005
    it("members of group author (temp account) can not create new user, will return insufficient permission", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            headers: {
                Authorization: "jwt " + temp.token,
                Accept: "application/json"
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1005);
            done();
        });
    });

    // PUT '/users/:id/group'
    it("change temp account's group author -> root (use root account's token) must be ok", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id, "/group"),
            form: {
                groupName: "root"
            },
            headers: {
                Authorization: "jwt " + root.token,
                Accept: "application/json"
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            assert.strictEqual(JSON.parse(body).groupName, "root");
            done();
        });
    });

    // PUT '/users/:id/group'
    it("change temp account's group by group do not exists (use root account's token) must be failed", function (done) {
        request({
            method: "PUT",
            url: util.format("%s://%s:%s%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id, "/group"),
            form: {
                groupName: "nmb"
            },
            headers: {
                Authorization: "jwt " + root.token,
                Accept: "application/json"
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 400);
            assert.strictEqual(JSON.parse(body).errorCode, 2003);
            done();
        });
    });

    it("delete temp user with right token must be ok", function (done) {
        request({
            method: "DELETE",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + temp.id),
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            assert.strictEqual(JSON.parse(body).userId, temp.id);
            done();
        });
    });

    it("log out root account(delete token) with right token must be ok", function (done) {
        request({
            method: "DELETE",
            url: util.format("%s://%s:%s%s", protocol, host, port, authentications),
            headers: {
                Authorization: "jwt " + root.token
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            done();
        });
    });

    // 1000
    it("log out root account (delete token) with none token must be failed", function (done) {
        request({
            method: "DELETE",
            url: util.format("%s://%s:%s%s", protocol, host, port, authentications),
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1000);
            done();
        });
    });

    it("get one of authors", function (done) {
        let id = root.id;
        request({
            method: "GET",
            url: util.format("%s://%s:%s%s%s", protocol, host, port, routerPrefix, "/" + id)
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            done();
        });
    });

    it("get the first page of authors, should be ok", function (done) {
        let page = 1;
        request({
            method: "GET",
            url: util.format("%s://%s:%s%s?page=%s", protocol, host, port, routerPrefix, page)
        }, function(error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 200);
            done();
        });
    });

    it("get a large page of authors, must be 404 not found", function (done) {
        let page = 100000000;
        request({
            method: "GET",
            url: util.format("%s://%s:%s%s?page=%s", protocol, host, port, routerPrefix, page)
        }, function(error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 404);
            done();
        });
    });

    it("generate two token(out of date, token do not in redis)", function (done) {
        outOfDateToken = jwt.sign({
            iss: -1,
            exp: new Date().valueOf()
        }, cert);

        doNotExistsToken = jwt.sign({
            iss: -1,
            exp: moment().utcOffset(8).add(1000, "seconds").valueOf()
        }, cert);

        assert.strictEqual(typeof outOfDateToken, "string");
        assert.strictEqual(typeof doNotExistsToken, "string");

        done();
    });

    // 1002
    it("if token out of date must ne failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            headers: {
                Authorization: "jwt " + outOfDateToken
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1002);
            done();
        });
    });

    // 1003
    it("if token do not exists must be failed", function (done) {
        request({
            method: "POST",
            url: util.format("%s://%s:%s%s", protocol, host, port, routerPrefix),
            headers: {
                Authorization: "jwt " + doNotExistsToken
            }
        }, function (error, response, body) {
            assert.strictEqual(error, null);
            assert.strictEqual(response.statusCode, 401);
            assert.strictEqual(JSON.parse(body).errorCode, 1003);
            done();
        });
    });
});
