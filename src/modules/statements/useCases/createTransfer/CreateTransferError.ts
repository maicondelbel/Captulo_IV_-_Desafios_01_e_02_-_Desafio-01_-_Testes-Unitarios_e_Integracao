import { AppError } from "../../../../shared/errors/AppError";

export namespace CreateTransferError {
  export class UserRecipientNotFound extends AppError {
    constructor() {
      super('User recipient not found', 404);
    }
  }

}
