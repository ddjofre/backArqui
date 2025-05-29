const express = require('express');
const { getDefaultUser, rechargeDefaultWallet, getDefaultPortfolio, createUser, getAllUsers, getUserByEmail } = require('../controllers/userController');
const { getByEmail } = require('../services/userService');

const router = express.Router();

router.get('/', getDefaultUser);
router.post('/:email/wallet/recharge', rechargeDefaultWallet);
router.get('/:email/portfolio', getDefaultPortfolio);

router.post('/new', createUser);
router.get('/getAll', getAllUsers);

router.get('/:email', getUserByEmail);


module.exports = router;