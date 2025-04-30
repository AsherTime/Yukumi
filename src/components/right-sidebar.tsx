import { Upload } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function RightSidebar() {
  return (
    <div className="w-80 min-h-screen bg-[#2e2e2e] p-4 space-y-6">
      <Card className="bg-black text-white border-0">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl text-center">POST NOW</CardTitle>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload
          </Link>
        </CardHeader>
      </Card>

      <Card className="bg-[#2e2e2e] border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Daily Tasks</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

