import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { AuthService } from "@/services/auth.service.ts"
import { AppError } from "@/utils/error.util.ts"

export class AuthController {
  constructor(private service: AuthService) {}

  signup = async (req: any, res: any) => {
    try {
      const result = await this.service.signup(req.body)
      res.status(HttpStatusCode.CREATED).json(result)
    } catch (error) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        error: new AppError("Signup failed", HttpStatusCode.BAD_REQUEST, "Authentication").message,
      })
    }
  }
}
