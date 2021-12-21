import * as crypto from 'crypto';
import { basename } from 'path/posix';

class Transaction {
    constructor(
        public amount: number,
        public payer: string, //Public Key
        public payee: string, //Public Key
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction, // Simpler to have 1 transaction per block - could expand
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256'); // Secure Hash Algorithm - Length 256 bits - One way
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    public static instance = new Chain(); // Singleton instance

    chain: Block[];

    constructor() {

        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });
        this.chain = [new Block('', new Transaction(10000, 'Thin', 'Air'))]; // Genesis Block
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        
        if (transaction.amount > this.calcBalance(senderPublicKey)) {
            console.log('Rejected by blockchain. Insufficient funds');
        } else {
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

    mine(nonce: number) {
        let solution = 1;
        console.log('Mining... ');

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            
            const attempt = hash.digest('hex');

            if (attempt.substring(1,5) === '0000') {
                console.log(`Solved ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }

    calcBalance(publicKey: string) {
        let balance = 0;

        for (let i = 0; i < this.chain.length; i++) {
            if (this.chain[i].transaction.payee == publicKey) {
                balance += Chain.instance.chain[i].transaction.amount;
            } else if (Chain.instance.chain[i].transaction.payer == publicKey) {
                balance -= Chain.instance.chain[i].transaction.amount;
            }
        }
        return balance;
    }
    
    issueICO(amount: number, publicKey: string) {
        let transaction = new Transaction(amount, 'Genesis', publicKey);
        const newBlock = new Block(this.lastBlock.hash, transaction);
        this.mine(newBlock.nonce);
        this.chain.push(newBlock);
    }
}

class Wallet {
    public publicKey: string;
    private privateKey: string;
    private balance: number;

    constructor() {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });

        this.privateKey = keyPair.privateKey;
        this.publicKey = keyPair.publicKey;
        this.balance = 0;

        }

        sendMoney(amount: number, payeePublicKey: string) {
            this.updateBalance();

            if (amount <= this.balance) {
                const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
                const sign = crypto.createSign('SHA256');
                sign.update(transaction.toString()).end();

                const signature = sign.sign(this.privateKey);

                Chain.instance.addBlock(transaction, this.publicKey, signature);
            } else {
                console.log(`Insufficient funds to transfer ${amount}. Available balance: ${this.balance}`);
            }
        }

        updateBalance() {
            this.balance = Chain.instance.calcBalance(this.publicKey);
        }

        buyCoin(USDamount: number, buyerPublicKey: string) {
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

    public static instance = new Exchange(); // Singleton instance
    private exchangeRate: number;
    public ICO: Wallet;
    constructor() {
        this.exchangeRate = Math.floor((Math.random() * 9000) + 1000); // Random USD value of one coin between 1000-10000
        this.ICO = new Wallet();
        Chain.instance.issueICO(1000000, this.ICO.publicKey);
    }

    buyCoin(USDamount: number, buyerPublicKey: string) {
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

// Testing usage

const sean = new Wallet();
const dev = new Wallet();
const phil = new Wallet();

console.log(`COIN PRICE: $${Exchange.instance.coinPrice}`)

sean.buyCoin(100000, sean.publicKey);
console.log(`SEAN COIN BALANCE: ${sean.currBalance}`)

sean.sendMoney(sean.currBalance - 5, dev.publicKey);

dev.sendMoney(3, phil.publicKey);

console.log(`SEAN COIN BALANCE: ${sean.currBalance}`)
console.log(`DEV COIN BALANCE: ${dev.currBalance}`)
console.log(`PHIL COIN BALANCE: ${phil.currBalance}`)

console.log(Chain.instance);

/* TO-DO
- Implement price fluctuations of USD/coin exchange rate in Exchange class
*/