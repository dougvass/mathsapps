export default function Footer() {
  return (
    <footer id="footer" className="bg-htz-navy text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold text-white">
              Hugos<span className="text-htz-lime">Toyz</span>
            </p>
            <p className="mt-2 text-sm">
              Playful 3D-printed fidgets and toys, made in small batches.
            </p>
          </div>

          <div>
            <p className="font-display font-semibold text-white">Contact</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="mailto:hello@hugostoyz.com" className="hover:text-htz-lime">
                  hello@hugostoyz.com
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-htz-lime">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-htz-lime">
                  TikTok
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display font-semibold text-white">Shipping</p>
            <p className="mt-2 text-sm">
              Aussie-wide shipping. Most orders print and ship within 3–5
              business days. Custom designs may take a little longer — worth
              the wait!
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} HugosToyz. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
