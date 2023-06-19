import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const RawHeaders = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        // console.log(req.rawHeaders);

        return req.rawHeaders;
    }
)