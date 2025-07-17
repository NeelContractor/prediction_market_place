// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import PredictionMarketplaceIDL from '../target/idl/prediction_marketplace.json'
import type { PredictionMarketplace } from '../target/types/prediction_marketplace'

// Re-export the generated IDL and type
export { PredictionMarketplace, PredictionMarketplaceIDL }

// The programId is imported from the program IDL.
export const PREDICTION_MARKETPLACE_PROGRAM_ID = new PublicKey(PredictionMarketplaceIDL.address)

// This is a helper function to get the Counter Anchor program.
export function getPredictionMarketplaceProgram(provider: AnchorProvider, address?: PublicKey): Program<PredictionMarketplace> {
  return new Program({ ...PredictionMarketplaceIDL, address: address ? address.toBase58() : PredictionMarketplaceIDL.address } as PredictionMarketplace, provider)
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getPredictionMarketplaceProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return new PublicKey('3e6RDfc3qPxtKGL9xav8bZrDu8NH2zt8wxo2dJjFtV76')
    case 'mainnet-beta':
    default:
      return PREDICTION_MARKETPLACE_PROGRAM_ID
  }
}
