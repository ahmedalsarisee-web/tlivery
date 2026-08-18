import {HttpsError} from "firebase-functions/v2/https";
import {InputError} from "../helpers";

export async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error instanceof InputError) {
      throw new HttpsError("invalid-argument", error.message, {
        field: error.field,
      });
    }
    console.error(error);
    throw new HttpsError("internal", "The operation could not be completed.");
  }
}
