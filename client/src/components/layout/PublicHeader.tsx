import { NavLink } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

interface PublicHeaderProps {
    /** Show Log in / Get Started buttons (default: false — used on auth pages) */
    showAuthButtons?: boolean;
}

/**
 * Shared header for public pages: Landing, Login, Register.
 * The "LinkForge" logo always navigates to "/".
 */
export function PublicHeader({ showAuthButtons = false }: PublicHeaderProps) {
    return (
        <header className="relative z-10 flex justify-between items-center px-4 md:px-8 h-16 border-b bg-background/50 backdrop-blur-md">
            <NavLink
                to="/"
                className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
                <div className="bg-primary/10 p-2 rounded-xl">
                    <LinkIcon className="h-5 w-5 text-primary" />
                </div>
                <span>LinkForge</span>
            </NavLink>

            <div className="flex items-center gap-4">
                <ModeToggle />
                {showAuthButtons && (
                    <>
                        <Button variant="ghost" asChild className="hidden sm:inline-flex">
                            <NavLink to="/login">Log in</NavLink>
                        </Button>
                        <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
                            <NavLink to="/register">Get Started</NavLink>
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}
