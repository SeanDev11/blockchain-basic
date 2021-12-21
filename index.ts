import * as crypto from 'crypto';

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
        this.chain = [new Block('', new Transaction(717, 'Thin', 'Air'))];
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
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
}

class Wallet {
    public publicKey: string;
    public privateKey: string;
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