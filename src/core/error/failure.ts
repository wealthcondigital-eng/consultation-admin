/// An error whose message is already fit to show the user.
///
/// The same contract as `Failure` in consultation_app/lib/core/error/failure.dart: nothing above
/// the data layer inspects a status code or a stack trace, it just shows
/// `message`.
export class Failure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Failure';
  }

  static network(): Failure {
    return new Failure('No connection. Check your network and try again.');
  }

  static unexpected(): Failure {
    return new Failure('Something went wrong. Please try again.');
  }

  static unauthorised(): Failure {
    return new Failure('Your session has ended. Please sign in again.');
  }
}

/// True for anything already carrying a user-facing message.
export function isFailure(error: unknown): error is Failure {
  return error instanceof Failure;
}

/// The message to show for any thrown value.
export function messageFor(error: unknown): string {
  return isFailure(error) ? error.message : Failure.unexpected().message;
}
