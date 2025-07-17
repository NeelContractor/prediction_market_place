import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js'
import { PredictionMarketplace } from '../target/types/prediction_marketplace'

describe('PredictionMarketplace', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.PredictionMarketplace as Program<PredictionMarketplace>

  
  const question = "Will i get new phone by the end of next month?"
  
  const user = Keypair.generate();
  const user2 = Keypair.generate();
  const user3 = Keypair.generate();
  let market = Keypair.generate();
  let betPda: PublicKey;
  let betPda2: PublicKey;
  let betPda3: PublicKey;

  // console.log("market:", market.publicKey);
  // console.log("user:", user.publicKey);
  // console.log("user2:", user2.publicKey);
  // console.log("user3:", user3.publicKey);

  beforeAll(async() => {
    const tx = await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    const tx2 = await provider.connection.requestAirdrop(user2.publicKey, 2 * LAMPORTS_PER_SOL);
    const tx3 = await provider.connection.requestAirdrop(user3.publicKey, 2 * LAMPORTS_PER_SOL);

    await provider.connection.confirmTransaction(tx, "confirmed");
    await provider.connection.confirmTransaction(tx2, "confirmed");
    await provider.connection.confirmTransaction(tx3, "confirmed");

    [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user.publicKey.toBuffer(), market.publicKey.toBuffer()],
      program.programId
    );
    [betPda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user2.publicKey.toBuffer(), market.publicKey.toBuffer()],
      program.programId
    );
    [betPda3] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user3.publicKey.toBuffer(), market.publicKey.toBuffer()],
      program.programId
    );
  });

  it('Initialize Market', async () => {
    await program.methods
      .createMarket(question)
      .accountsPartial({
        creator: payer.publicKey,
        market: market.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([payer.payer, market])
      .rpc()

    const marketAcc = await program.account.market.fetch(market.publicKey);
    // console.log(marketAcc)

    // expect(marketAcc.creator).toEqual(payer.payer);
    // expect(marketAcc.question).toEqual(question);

  })

  it("place bet", async () => {
    let outcome = true;
    let amount = 1 * LAMPORTS_PER_SOL;
    const tx = await program.methods
      .placeBet(outcome, new anchor.BN(amount))
      .accountsPartial({
        user: user.publicKey,
        market: market.publicKey,
        bet: betPda,
        systemProgram: SystemProgram.programId
      })
      .signers([user])
      .rpc({ skipPreflight: true });

      // const marketAcc = await program.account.market.fetch(market.publicKey);
      // const betAcc = await program.account.bet.fetch(betPda);
      
      // console.log(marketAcc);
      console.log(tx);
      // console.log(betAcc);
  })

  // it("place bet 2", async () => {
  //   let outcome = false;
  //   let amount = 0.1 * LAMPORTS_PER_SOL;
  //   await program.methods
  //     .placeBet(outcome, new anchor.BN(amount))
  //     .accountsPartial({
  //       user: user2.publicKey,
  //       market: market.publicKey,
  //       bet: betPda2,
  //       systemProgram: SystemProgram.programId
  //     })
  //     .signers([user2])
  //     .rpc();

  //     const marketAcc = await program.account.market.fetch(market.publicKey);
  //     const betAcc = await program.account.bet.fetch(betPda2);

  //     console.log(marketAcc);
  //     console.log(betAcc);
  // })
  // it("place bet 3", async () => {
  //   let outcome = true;
  //   let amount = 0.1 * LAMPORTS_PER_SOL;
  //   await program.methods
  //     .placeBet(outcome, new anchor.BN(amount))
  //     .accountsPartial({
  //       user: user3.publicKey,
  //       market: market.publicKey,
  //       bet: betPda3,
  //       systemProgram: SystemProgram.programId
  //     })
  //     .signers([user3])
  //     .rpc();

  //     const marketAcc = await program.account.market.fetch(market.publicKey);
  //     const betAcc = await program.account.bet.fetch(betPda3);

  //     console.log(marketAcc);
  //     console.log(betAcc);
  // })

  // it("resolve", async () => {
  //   let outcome = true;
  //   await program.methods
  //     .resolveMarket(outcome)
  //     .accountsPartial({
  //       creator: payer.publicKey,
  //       market: market.publicKey
  //     })
  //     .signers([payer.payer])
  //     .rpc()
  //     console.log("done resolve");
  // })

  // it("claim 1", async () => {
  //   await program.methods
  //     .claim()
  //     .accountsPartial({
  //       user: user.publicKey,
  //       market: market.publicKey,
  //       bet: betPda
  //     })
  //     .signers([user])
  //     .rpc()
  //     console.log("done resolve");
  // })
  // it("claim 3", async () => {
  //   await program.methods
  //     .claim()
  //     .accountsPartial({
  //       user: user3.publicKey,
  //       market: market.publicKey,
  //       bet: betPda3
  //     })
  //     .signers([user3])
  //     .rpc()
  //     console.log("done resolve");
  // })
})
