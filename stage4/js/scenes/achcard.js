import { CONFIG } from '../config.js?v=2';
import { Audio } from '../audio.js?v=2';
import { addPanel, addText, runTypewriter } from '../ui.js?v=2';
import { ACHIEVEMENTS, clearCardPending } from '../achievements.js?v=2';
import { readMeta } from '../meta.js?v=2';
import { pendingCards, markAnnounced } from '../unlocks.js?v=2';

/**
 * The "UNLOCKED: Achievements" card. Typewriter at the normal 70 ms per character,
 * a tap finishes the line, and the card waits for a tap to continue.
 * Resolves when dismissed. Clears the pending flag in the meta store.
 */
export function showAchUnlockCard(scene, opts = {}) {
  return new Promise((resolve) => {
    const meta = readMeta();
    const earned = ACHIEVEMENTS.filter((row) => meta.achs[row.id]);
    const lines = [
      'Somebody down here is keeping score.',
      'Achievements are on the title menu now. They count from your very first run.',
    ];
    if (earned.length) {
      lines.push(`Already earned (${earned.length}): ${earned.map((row) => row.name).join(', ')}.`);
    } else {
      lines.push('Nothing earned yet. The corn is patient.');
    }
    const full = lines.join('\n\n');
    showCard(scene, {
      title: 'ACHIEVEMENTS',
      full,
      depth: opts.depth,
      handle: '__PREPPER_ACHCARD',
      onFinish: clearCardPending,
    }).then(resolve);
  });
}

/**
 * Shared unlock-card look: solid card, UNLOCKED kicker, big title, 70 ms typewriter,
 * first tap finishes the line, the next tap (on finger-up) closes it.
 */
function showCard(scene, { kicker = 'UNLOCKED', title, full, depth, handle, onFinish }) {
  return new Promise((resolve) => {
    const root = scene.add.container(0, 0).setDepth(depth ?? 300);
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive();
    // Solid backing so the screen underneath doesn't show through the text.
    const backing = scene.add.rectangle(640, 360, 896, 456, 0x0b0f18, 1);
    const panel = addPanel(scene, 190, 130, 900, 460);
    const kick = addText(scene, 640, 168, kicker, {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    });
    const head = addText(scene, 640, 218, title, {
      fontFamily: CONFIG.FONTS.display,
      fontSize: title.length > 16 ? '50px' : '64px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    });
    const body = addText(scene, 250, 270, '', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '22px', color: CONFIG.COLORS.text,
      wordWrap: { width: 780 }, lineSpacing: 6,
    });
    const hint = addText(scene, 640, 566, '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '16px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    });
    root.add([blocker, backing, panel, kick, head, body, hint]);
    let typed = false;
    let done = false;
    const typer = runTypewriter(scene, body, full, () => {
      typed = true;
      hint.setText('Tap to continue');
    }, true);
    const finish = () => {
      if (done) return;
      done = true;
      onFinish?.();
      root.destroy();
      resolve();
    };
    // Close on pointerup, not pointerdown: closing on the down press let the matching
    // up land on a menu button under the card (e.g. CREDITS on the ending screen).
    let armed = false;
    blocker.on('pointerdown', () => {
      Audio.unlock();
      if (!typed) {
        typer.skip();
        armed = false;
        return;
      }
      armed = true;
    });
    blocker.on('pointerup', () => {
      if (armed && typed) finish();
    });
    scene.events.once('shutdown', () => {
      typer.cancel();
      if (!done) { done = true; resolve(); }
    });
    globalThis[handle] = { open: true, title, text: full, typed: () => typed };
    root.once('destroy', () => { globalThis[handle] = { open: false }; });
  });
}

/** True when the achievements card or any built Part A unlock card still has to be shown. */
export function hasPendingCards() {
  return readMeta().achCardPending || pendingCards().length > 0;
}

/**
 * Shows every pending card, one after another: achievements first (its own card),
 * then each built unlock in track order. Unbuilt unlocks wait silently for Part B/C.
 */
export async function showPendingCards(scene, opts = {}) {
  if (readMeta().achCardPending) {
    await showAchUnlockCard(scene, opts);
    if (!scene.sys?.isActive()) return;
  }
  for (const card of pendingCards()) {
    if (!scene.sys?.isActive()) return;
    await showCard(scene, {
      title: card.title,
      full: card.body,
      depth: opts.depth,
      handle: '__PREPPER_UNLOCKCARD',
      onFinish: () => markAnnounced(card.id),
    });
  }
}
