"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, //Public Key
    payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, transaction, // Simpler to have 1 transaction per block - could expand
    ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256'); // Secure Hash Algorithm - Length 256 bits - One way
        hash.update(str).end();
        return hash.digest('hex');
    }
}
class Chain {
    constructor() {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.chain = [new Block('', new Transaction(10000, 'Thin', 'Air'))]; // Genesis Block
    }
    addBlock(transaction, senderPublicKey, signature) {
        if (transaction.amount > this.calcBalance(senderPublicKey)) {
            console.log('Rejected by blockchain. Insufficient funds');
        }
        else {
            const verifier = crypto.createVerify('SHA256');
            verifier.update(transaction.toString());
            const isValid = verifier.verify(senderPublicKey, signature);
            if (isValid) {
                const newBlock = new Block(this.lastBlock.hash, transaction);
                this.mine(newBlock.nonce);
                this.chain.push(newBlock);
            }
        }
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    mine(nonce) {
        let solution = 1;
        console.log('Mining... ');
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(1, 5) === '0000') {
                console.log(`Solved ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    calcBalance(publicKey) {
        let balance = 0;
        for (let i = 0; i < this.chain.length; i++) {
            if (this.chain[i].transaction.payee == publicKey) {
                balance += Chain.instance.chain[i].transaction.amount;
            }
            else if (Chain.instance.chain[i].transaction.payer == publicKey) {
                balance -= Chain.instance.chain[i].transaction.amount;
            }
        }
        return balance;
    }
    issueICO(amount, publicKey) {
        let transaction = new Transaction(amount, 'Genesis', publicKey);
        const newBlock = new Block(this.lastBlock.hash, transaction);
        this.mine(newBlock.nonce);
        this.chain.push(newBlock);
    }
}
Chain.instance = new Chain(); // Singleton instance
class Wallet {
    constructor() {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keyPair.privateKey;
        this.publicKey = keyPair.publicKey;
        this.balance = 0;
    }
    sendMoney(amount, payeePublicKey) {
        this.updateBalance();
        if (amount <= this.balance) {
            const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
            const sign = crypto.createSign('SHA256');
            sign.update(transaction.toString()).end();
            const signature = sign.sign(this.privateKey);
            Chain.instance.addBlock(transaction, this.publicKey, signature);
        }
        else {
            console.log(`Insufficient funds to transfer ${amount}. Available balance: ${this.balance}`);
        }
    }
    updateBalance() {
        this.balance = Chain.instance.calcBalance(this.publicKey);
    }
    buyCoin(USDamount, buyerPublicKey) {
        // Allowing fractional coin buying.
        if (USDamount >= 100) { // Minimum buying power is 100 USD
            let coinAmount = USDamount / Exchange.instance.coinPrice;
            Exchange.instance.ICO.sendMoney(coinAmount, buyerPublicKey);
        }
    }
    get currBalance() {
        this.updateBalance();
        return this.balance;
    }
}
class Exchange {
    constructor() {
        this.exchangeRate = Math.floor((Math.random() * 9000) + 1000); // Random USD value of one coin between 1000-10000
        this.ICO = new Wallet();
        Chain.instance.issueICO(1000000, this.ICO.publicKey);
    }
    buyCoin(USDamount, buyerPublicKey) {
        // Will not allow fractional coin buying.
        let coinAmount = USDamount / this.exchangeRate;
        if (coinAmount >= 1) {
            this.ICO.sendMoney(coinAmount, buyerPublicKey);
        }
    }
    get coinPrice() {
        return this.exchangeRate;
    }
}
Exchange.instance = new Exchange(); // Singleton instance
// Testing usage
const sean = new Wallet();
const dev = new Wallet();
const phil = new Wallet();
console.log(`COIN PRICE: $${Exchange.instance.coinPrice}`);
sean.buyCoin(100000, sean.publicKey);
console.log(`SEAN COIN BALANCE: ${sean.currBalance}`);
sean.sendMoney(sean.currBalance - 5, dev.publicKey);
dev.sendMoney(3, phil.publicKey);
console.log(`SEAN COIN BALANCE: ${sean.currBalance}`);
console.log(`DEV COIN BALANCE: ${dev.currBalance}`);
console.log(`PHIL COIN BALANCE: ${phil.currBalance}`);
console.log(Chain.instance);
/* TO-DO
- Implement price fluctuations of USD/coin exchange rate in Exchange class
*/ 
