import Counter from "../models/counter.model";

export class CounterRepository {
  async getNextIdFromDB(): Promise<number> {
    const counter = await Counter.findOneAndUpdate(
      {},
      { $inc: { counterValue: 1 } },
      {
        new: true, // return updated value
        upsert: true, // create if not exists
      },
    );

    return counter?.counterValue || 1;
  }
}
