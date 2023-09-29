import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";

import * as freecell from "./freecell.js";

Deno.test("create a game", () => {
  const renderer = {
    Render: () => {},
  };
  freecell.Play(renderer, () => {});
});

Deno.test("create an ordered deck", () => {
  const deck = freecell.OrderedDeck();

  const cards = [];
  while (!deck.Empty()) cards.push(deck.Take());

  assertEquals(cards.length, 52);

  assertEquals(cards[0].Suit(), "Diamonds");
  assertEquals(cards[0].Rank(), freecell.Ranks.Ace);
  assertEquals(cards[1].Suit(), "Diamonds");
  assertEquals(cards[1].Rank(), 2);
  assertEquals(cards[51].Suit(), "Spades");
  assertEquals(cards[51].Rank(), freecell.Ranks.King);
});

Deno.test("create a specific deck", () => {
  const deck = freecell.Deck("ACE");

  const cards = [];
  while (!deck.Empty()) cards.push(deck.Take());

  assertEquals(cards.map((c) => c.Suit()), [
    "Diamonds",
    "Diamonds",
    "Diamonds",
  ]);
  assertEquals(cards.map((c) => c.Rank()), [freecell.Ranks.Ace, 3, 5]);
});

Deno.test("ordered deck has known ID", () => {
  assertEquals(
    freecell.OrderedDeck().ID(),
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  );
});
