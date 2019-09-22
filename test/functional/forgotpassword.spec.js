const { test, trait } = use("Test/Suite")("Forgot Password");
const { subHours, format } = require("date-fns");

const Mail = use("Mail");
const Hash = use("Hash");
const Database = use("Database");

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use("Factory");

/**@type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use("App/Models/User");

trait("Test/ApiClient");
trait("DatabaseTransactions");

test("Teste de envio de e-mail", async ({ assert, client }) => {
  Mail.fake();

  const email = "pslima@uneb.br";

  const user = await Factory.model("App/Models/User").create({ email });

  await client
    .post("/forgot")
    .send({ email })
    .end();

  const token = await user.tokens().first();

  const recentEmail = Mail.pullRecent();

  assert.equal(recentEmail.message.to[0].address, email);

  assert.include(token.toJSON(), {
    type: "forgotpassword"
  });

  Mail.restore();
});

test("Teste do reset da senha", async ({ assert, client }) => {
  Mail.fake();

  const email = "pslima@uneb.br";

  const user = await Factory.model("App/Models/User").create({ email });
  const userToken = await Factory.model("App/Models/Token").create();
  await user.tokens().save(userToken);

  const response = await client
    .post("/reset")
    .send({
      token: userToken.token,
      password: "123456",
      password_confirmation: "123456"
    })
    .end();

  response.assertStatus(204);
  await user.reload();
  const checkPassword = await Hash.verify("123456", user.password);
  assert.isTrue(checkPassword);
});

test("resete da senha em ate 2 horas", async ({ assert, client }) => {
  const email = "pslima@uneb.br";

  const user = await Factory.model("App/Models/User").create({ email });
  const userToken = await Factory.model("App/Models/Token").make();
  await user.tokens().save(userToken);

  const dateWithSub = format(subHours(new Date(), 2), "yyyy-MM-dd HH:ii:ss");

  await Database.table("tokens")
    .where("token", userToken.token)
    .update("created_at", dateWithSub);

  await userToken.reload();

  const response = await client
    .post("/reset")
    .send({
      token: userToken.token,
      password: "123456",
      password_confirmation: "123456"
    })
    .end();

  response.assertStatus(400);
});
