import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface DebugModalProps {
    user?: {
        name: string;
        email: string;
        code?: string;
        settings?: Record<string, unknown>;
        [key: string]: unknown;
    };
}

export function DebugModal({ user }: DebugModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                    title="Debug Info"
                >
                    <Info className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Debug Information</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto">
                    <div>
                        <h3 className="text-sm font-medium mb-2">User Information</h3>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[300px] text-xs font-mono">
                            <pre>{JSON.stringify(user, null, 2)}</pre>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-2">System Info</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Version:</strong> 1.0.0 (Tet 2026)</p>
                            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                            <p><strong>Base URL:</strong> {window.location.origin}</p>
                            <p><strong>Current Path:</strong> {window.location.pathname}</p>
                        </div>
                    </div>

                    {user?.code && (
                        <div>
                            <h3 className="text-sm font-medium mb-2">Wheel Info</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Wheel Code:</strong> {user.code}</p>
                                <p><strong>Share Link:</strong> {window.location.origin}/{user.code}</p>
                                <p><strong>Status:</strong> {user?.settings?.is_paused ? '⏸️ Paused' : '▶️ Active'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
