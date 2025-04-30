import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight } from "lucide-react"

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="max-w-md w-full px-6">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-semibold text-orange-500">Let&apos;s confirm you are human</h1>

          <p className="text-gray-400">
            Complete the security check before continuing. This step verifies that you are not a bot, which helps to
            protect your account and prevent spam.
          </p>

          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 h-auto text-lg">
            Begin
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="pt-4">
            <Select defaultValue="english">
              <SelectTrigger className="w-[180px] mx-auto bg-transparent border-gray-700">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="japanese">日本語</SelectItem>
                <SelectItem value="korean">한국어</SelectItem>
                <SelectItem value="chinese">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

