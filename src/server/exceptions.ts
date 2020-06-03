export class HttpError {
    code: number;
    message: string;

    constructor(code: number, message: string) {
        this.code = code;
        this.message = message;
    }
}

export class BadRequestException extends HttpError {
    constructor(message: string) {
        super(400, message);
    }
}

export class ForbiddenException extends HttpError {
    constructor(message: string) {
        super(403, message);
    }
}

export class NotFoundException extends HttpError {
    constructor(message: string) {
        super(404, message);
    }
}