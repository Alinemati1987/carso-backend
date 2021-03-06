const bcrypt = require("bcrypt");
const { Router } = require("express");
const { toJWT } = require("../auth/jwt");
const authMiddleware = require("../auth/middleware");
const User = require("../models").user;
const SALT_ROUNDS = 10;

const router = new Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Please provide both email and password" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).send({
        message: "User with that email not found or password incorrect",
      });
    }

    delete user.dataValues["password"]; // don't send back the password hash
    const token = toJWT({ userId: user.id });
    return res.status(200).send({ token, ...user.dataValues });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Something went wrong, sorry" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, password, name, isSeller } = req.body;
  if (!email || !password || !name) {
    return res.status(400).send("Please provide an email, password and a name");
  }

  try {
    const newUser = await User.create({
      email,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
      name,
      isSeller,
    });

    delete newUser.dataValues["password"]; // don't send back the password hash

    const token = toJWT({ userId: newUser.id });
    console.log("new user", newUser);
    res.status(201).json({ token, ...newUser.dataValues });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .send({ message: "There is an existing account with this email" });
    }

    return res.status(400).send({ message: "Something went wrong, sorry" });
  }
});

// The /me endpoint can be used to:
// - get the users email & name using only their token
// - checking if a token is (still) valid
router.get("/me", authMiddleware, async (req, res) => {
  // don't send back the password hash
  delete req.user.dataValues["password"];
  res.status(200).send({ ...req.user.dataValues });
});

module.exports = router;

router.patch("/update/:id", async (req, res) => {
  const newUser = await User.findByPk(req.params.id);
  const { phone, address, name, password } = req.body;
  // console.log(newUser);
  // console.log("phone is:", newUser.name);

  console.log("req phone is", phone);
  console.log("req address is", address);
  console.log("req name is", name);
  console.log("req password is", password);

  if (password === "" || password === null || password === undefined) {
    await newUser.update({ name, phone, address });
  } else {
    await newUser.update({
      name,
      phone,
      address,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
    });
  }

  return res.status(200).send({ newUser });
});

router.delete("/user/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const reqUser = await User.findByPk(id);

  console.log("del req user is", reqUser);

  const deletedUser = await reqUser.destroy();

  return res
    .status(200)
    .send({ message: "The user is deleted", delUser: deletedUser });
});
