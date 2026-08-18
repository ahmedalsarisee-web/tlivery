import assert from "node:assert/strict";
import test from "node:test";
import {
  InputError,
  assertPendingTransition,
  normalizedInviteCode,
  normalizedPhone,
  randomInviteCode,
  requiredString,
  stableApplicationId,
} from "../src/helpers";

test("normalizes E.164 phone numbers", () => {
  assert.equal(normalizedPhone("+962 79 123 4567"), "+962791234567");
  assert.throws(() => normalizedPhone("0791234567"), InputError);
});

test("normalizes and validates invite codes", () => {
  assert.equal(normalizedInviteCode("abcd2345"), "ABCD2345");
  assert.throws(() => normalizedInviteCode("ABCO1234"), InputError);
});

test("builds stable application IDs", () => {
  assert.equal(stableApplicationId("driver", "user_123"), "driver_user_123");
  assert.throws(() => stableApplicationId("driver", "bad/id"), InputError);
});

test("allows only pending or idempotent state transitions", () => {
  assert.equal(assertPendingTransition("pending", "approved"), "apply");
  assert.equal(
    assertPendingTransition("approved", "approved"),
    "already_applied",
  );
  assert.throws(
    () => assertPendingTransition("rejected", "approved"),
    InputError,
  );
});

test("validates bounded required strings", () => {
  assert.equal(requiredString({name: "  Wasel  "}, "name", 10), "Wasel");
  assert.throws(() => requiredString({name: ""}, "name"), InputError);
  assert.throws(() => requiredString({name: "too long"}, "name", 3), InputError);
});

test("maps secure bytes into an unambiguous invite alphabet", () => {
  const code = randomInviteCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 255]));
  assert.match(code, /^[A-Z2-9]{8}$/);
  assert.doesNotMatch(code, /[01IO]/);
});
