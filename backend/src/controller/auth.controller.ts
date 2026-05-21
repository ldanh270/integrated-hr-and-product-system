import { AuthService } from "@/service/auth.service.ts"

export class AuthController {
  constructor(private service: AuthService) {}

  signup = async (req: any, res: any) => {
    try {
      const result = await this.service.signup(req.body)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  }
}
