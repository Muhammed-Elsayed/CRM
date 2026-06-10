export class WebError extends Error {
    statusCode: number;
    statusText: string;

    constructor(statusCode: number, statusText: string, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.statusText = statusText;
        Object.setPrototypeOf(this, WebError.prototype);
    };

    // Static methods for known errors, each accepting optional custom messages
    static NotFound(message: string) {
        return new WebError(404, "Not Found", message);
    };

    static UnprocessableEntity(message: string) {
        return new WebError(422, "Unprocessable Entity", message);
    };

    static UnAuthorized(message: string) {
        return new WebError(401, "Unauthorized", message);
    };

    static Forbidden(message: string) {
        return new WebError(403, "Forbidden", message);
    };

    static BadRequest(message: string) {
        return new WebError(400, "Bad Request", message);
    };

    static InternalServerError(message = "An unexpected error occurred on the server.") {
        return new WebError(500, "Internal Server Error", message);
    };

}