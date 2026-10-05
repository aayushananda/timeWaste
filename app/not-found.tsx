import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="slide not-found" data-theme="blush">
      <div className="shell">
        <p className="slide-word">lost?</p>
        <p className="measure not-found-note">
          That page does not exist. The work is all one click away.
        </p>
        <div className="not-found-links">
          <Link href="/" className="chip">
            back home
          </Link>
          <Link href="/works/" className="chip">
            my works
          </Link>
        </div>
      </div>
    </section>
  );
}
