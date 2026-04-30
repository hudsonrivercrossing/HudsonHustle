# Hudson Hustle Player Guide

## Welcome
Hudson Hustle is a route-building game about connecting the NYC/NJ metro area before your rivals lock down the best crossings. You will collect transit cards, claim routes on the map, complete destination tickets, and decide when to spend precious stations to rescue a plan.

If you are brand new, open the in-app `Guide` from the main page or the game board. It teaches the rules as a short step-by-step rulebook without changing the table state.

## Bot Seat Note
Local setup and online multiplayer may include one or more built-in `bot` seats.

What stays true:
- `bot` seats still play by the same route, ticket, and scoring rules
- local `bot` seats advance automatically on the shared laptop
- online `bot` seats are server-owned and do not use reconnect tokens
- human seats keep the normal reconnect flow if they refresh or briefly disconnect

## Goal
Finish the game with the highest score.

You score points by:
- claiming routes
- completing destination tickets
- keeping stations unused
- earning the longest continuous network bonus

You lose points for unfinished destination tickets.

If you need a quick reminder during play, use the in-app `Scoring` button in the top bar. It summarizes route points and endgame bonuses without leaving the table.

## First Game Setup
1. Choose `2-4` seats.
2. Mark any non-first local seats as human or bot.
3. Choose the map and optional table pace label.
4. Each human player privately reviews one long ticket and three regular tickets.
5. Keep at least two of those tickets, then hand the laptop to the next human player when the screen tells you to.

## What You Do On Your Turn
Choose exactly one action:
- Draw transit cards.
- Claim a route.
- Draw new destination tickets.
- Build a station.

When your turn is finished, click `I'm done`. The app hides your private information and shows a neutral handoff screen for the next player.

If you draw new destination tickets, that action is committed.

What that means:
- you must finish the ticket choice before taking any other action
- you must keep at least one of the drawn tickets
- there is no `Back` button to return the draw and change plans

Your private ticket panel also acts as a live checklist:
- `Pending` means your current owned network does not connect the ticket yet.
- `Connected` means your current owned network already completes it.

## Drawing Transit Cards
- Most turns let you draw two cards.
- You can draw from the face-up market or the deck.
- When you draw from the deck, the app briefly reveals the card before play continues.
- If you take a face-up locomotive, that ends your draw action immediately.
- If the face-up market becomes flooded with locomotives, the market refreshes automatically.

## Claiming Routes
- Spend cards that match the route length and color.
- You must also have at least that many trains remaining. If a route is length `4`, you need `4` trains left to claim it.
- Gray routes can be claimed with any one color set.
- Longer routes score more points.
- If a route is already claimed, it is gone for the rest of the game unless it is a still-open parallel route.
- In `2-3` player games, if one side of a double route is claimed, the twin side is locked too.

### Tunnels
Tunnel routes are risky.

How they work:
1. First make sure you can pay the printed route cost.
2. When you try to claim the route, the game reveals extra cards.
3. Every revealed card that matches your chosen color, or is a locomotive, raises the cost by `1`.
4. If you can cover the surcharge, you claim the route normally.
5. If you cannot cover the surcharge, the claim fails and your turn is spent.

Practical advice:
- Do not enter a tunnel with the exact minimum unless you are willing to gamble.
- Locomotives are the safest tunnel insurance.

### Ferries
Ferries require locomotives as part of the payment.

How they work:
- The route still has a normal length and color.
- But the route also shows a minimum locomotive requirement.
- You must include at least that many locomotives in your payment.

Example:
- A length `3` ferry with `1` locomotive requirement means:
  - at least `1` card must be a locomotive
  - the other `2` cards follow the route's normal color rules

## Building Stations
- Each player has three stations.
- Station cost increases as you build more:
  - first station: `1` card
  - second station: `2` cards
  - third station: `3` cards
- A city can only hold one station total.
- A station does not help you claim routes during play.
- Its value is at endgame ticket scoring.

How borrowing works:
- Each station may borrow exactly `1` adjacent route that another player already claimed.
- It does not borrow that player's whole network.
- It does not give you route points for that borrowed route.
- It only helps when the game checks whether your destination tickets connect.

Example:
- You connect into `World Trade`.
- Another player owns `World Trade -> Exchange Pl.`.
- If you built a station at `World Trade`, the game may use that one borrowed adjacent route when scoring your tickets.
- It will not also give you the rest of that player's Jersey network.

Why stations are a tradeoff:
- They rescue ticket plans.
- But every station you do not build is worth bonus points at the end.
- So a station is usually strongest when it saves a big ticket or bypasses a critical blockage.

## End Of The Game
The final round starts when a player ends a turn with two or fewer trains remaining, or when a claimed route leaves no routes open on the board. Every other player gets one last turn.

Then the game scores:
1. route points already earned during play
2. completed and incomplete tickets
3. unused stations
4. longest network bonus

## Common Mistakes
- Taking too many tickets too early.
- Saving locomotives for too long instead of securing a critical route.
- Ignoring stations until every crossing is blocked.
- Treating tunnels like normal routes and forgetting they can suddenly cost more.
- Forgetting that ferries reserve locomotives before the rest of the payment.
- Forgetting that gray routes still need cards of a single color.
