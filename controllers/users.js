const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/users');

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => res.send({ users }))
    .catch(() => res.status(500).send({ message: 'На сервере произошла ошибка' }));
};

module.exports.createUser = (req, res) => {
  // const { name, about, avatar, email, password } = req.body;
  if (req.body.password === undefined || req.body.password.length < 8) {
    res.status(400).send({ message: 'Укажите пароль длиной не менее 8 символов' });
  } else {
    bcrypt.hash(req.body.password, 10)
      .then((hash) => User.create({
        email: req.body.email,
        password: hash, // записываем хеш в базу
        name: req.body.name,
        avatar: req.body.avatar,
        about: req.body.about,
      }))
      .then((user) => res.send({ data: user }))
      .catch((err) => {
        if (err instanceof mongoose.Error.ValidationError || err.message.indexOf('duplicate key error') !== -1 || err.name === 'Исключение, определенное пользователем') {
          res.status(400).send({ message: err.message });
        }
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      });
  }
};

module.exports.getUser = (req, res) => {
  User.findById(req.params.id)
    .orFail(() => {
      res.status(404).send({ message: 'Нет такого пользователя' });
    })
    .then((user) => res.send({ user }))
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        res.status(404).send({ message: 'Нет такого пользователя' });
      }
      res.status(500).send({ message: 'На сервере произошла ошибка' });
    });
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'some-secret-key', { expiresIn: '7d' });

      res.send({ token });
    })
    .catch((err) => {
      res
        .status(401)
        .send({ message: err.message });
    });
};
