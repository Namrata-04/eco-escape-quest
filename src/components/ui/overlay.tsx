import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameOverlayProps {
	title: string;
	description?: string;
	emoji?: string; // optional; if not provided, no emoji shown
	variant: 'success' | 'fail';
	primary?: { label: string; onClick: () => void };
	secondary?: { label: string; onClick: () => void };
	show: boolean;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
	title,
	description,
	emoji,
	variant,
	primary,
	secondary,
	show,
}) => {
	const particles = useMemo(() => Array.from({ length: 32 }, () => ({
		left: Math.random() * 100,
		dx: (Math.random() * 160 - 80),
		dy: (-60 - Math.random() * 140),
		delay: Math.random() * 120,
		color: variant === 'success' ? 'text-primary' : 'text-danger',
	})), [variant]);

	useEffect(() => {
		if (!show) return;
		try {
			const audio = new Audio(variant === 'success' ? '/success.mp3' : '/fail.mp3');
			audio.volume = 0.4;
			audio.play().catch(() => {});
		} catch {}
	}, [show, variant]);

	if (!show) return null;

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in-up">
			<div
				className={cn(
					'relative max-w-lg w-[92%] p-8 rounded-2xl text-center overflow-hidden',
					variant === 'success' ? 'solution-card' : 'crisis-card'
				)}
			>
				{/* particle burst */}
				<div className="pointer-events-none absolute inset-0">
					{particles.map((p, idx) => (
						<span
							key={idx}
							className={cn('sparkle', p.color)}
							style={{
								left: `${50 + (p.left - 50)}%`,
								top: '55%',
								['--dx' as any]: `${p.dx}px`,
								['--dy' as any]: `${p.dy}px`,
								animationDelay: `${p.delay}ms`,
							}}
						/>
					))}
				</div>
				{emoji && <div className="text-6xl mb-3">{emoji}</div>}
				<h3 className={cn('font-gaming text-3xl font-bold mb-2', 'text-white')}>{title}</h3>
				{description && (
					<p className={cn('mb-6', 'text-white/90')}>{description}</p>
				)}
				<div className="flex gap-3 justify-center">
					{secondary && (
						<Button variant="outline" onClick={secondary.onClick}>
							{secondary.label}
						</Button>
					)}
					{primary && (
						<Button variant="solution" onClick={primary.onClick}>
							{primary.label}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
