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
        this.chain = [new Block('', new Transaction(717, 'Thin', 'Air'))];
    }
    addBlock(transaction, senderPublicKey, signature) {
        //const newBlock = new Block(this.lastBlock.hash, transaction);
        //this.chain.push(newBlock);
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
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
}
// Testing usage
const sean = new Wallet();
const dev = new Wallet();
sean.sendMoney(75, dev.publicKey);
dev.sendMoney(150, sean.publicKey);
console.log(Chain.instance);
/* TO-DO
- Add fund verification before sending.
- Add balance for each wallet +- coins
-

*/ 
