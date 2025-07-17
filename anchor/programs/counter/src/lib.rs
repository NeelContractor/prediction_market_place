#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("3e6RDfc3qPxtKGL9xav8bZrDu8NH2zt8wxo2dJjFtV76");

#[program]
pub mod counter {
    use super::*;

    pub fn create_market(ctx: Context<CreateMarket>, question: String) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.question = question;
        market.creator = ctx.accounts.creator.key();
        market.total_no = 0;
        market.total_yes = 0;
        market.status = MarketStatus::Open;
        market.result = None;
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, outcome: bool, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, MarketError::MarketClosed);

        if outcome {
            market.total_yes += amount;
        } else {
            market.total_no += amount;
        }

        let bet = &mut ctx.accounts.bet;
        bet.user = ctx.accounts.user.key();
        bet.market = market.key();
        bet.outcome = outcome;
        bet.amount = amount;
        bet.claimed = false;

        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, MarketError::MarketAlreadyResolved);
        market.result = Some(outcome);
        market.status = MarketStatus::Resolved;
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        require!(market.status == MarketStatus::Resolved, MarketError::MarketNotResolved);
        require!(!bet.claimed, MarketError::AlreadyClaimed);

        if market.result.unwrap() != bet.outcome {
            return err!(MarketError::WrongOutcome);
        }

        let total_pool = market.total_yes + market.total_no;
        let winners_pool = if bet.outcome { market.total_yes } else { market.total_no };

        let share = (bet.amount as u128 * total_pool as u128) / winners_pool as u128;
        let share = share as u64;

        **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? -= share;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += share;

        bet.claimed = true;
        Ok(())
    }

}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = creator
    )]
    pub market: Account<'info, Market>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut, 
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    #[max_len(100)]
    pub question: String,
    pub creator: Pubkey,
    pub total_no: u64,
    pub total_yes: u64,
    pub result: Option<bool>,
    pub status: MarketStatus,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub outcome: bool,
    pub amount: u64,
    pub claimed: bool,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,
    Resolved
}

#[error_code]
pub enum MarketError {
    #[msg("Market is already resolved.")]
    MarketAlreadyResolved,
    #[msg("Market is closed.")]
    MarketClosed,
    #[msg("Market not resolved yet.")]
    MarketNotResolved,
    #[msg("User chose wrong outcome.")]
    WrongOutcome,
    #[msg("Reward already claimed.")]
    AlreadyClaimed,
}