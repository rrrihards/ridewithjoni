import React, { useEffect, useState, useRef } from "react";

/* ------------------------ helpers ------------------------ */
function buildGCalCreateUrl({ title, details, location, startISO, endISO }) {
  const fmt = (iso) =>
    iso.replace(/[-:]/g, "").replace(".000", "").replace(/\+\d{2}:?\d{2}$/, "Z");
  const text = encodeURIComponent(title || "Lesson with Joni Vollenberg");
  const dates = `${fmt(startISO)}/${fmt(endISO)}`;
  const det = encodeURIComponent(details || "");
  const loc = encodeURIComponent(location || "");
  return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${text}&dates=${dates}&details=${det}&location=${loc}`;
}
function toISOWithDuration(dateStr, timeStr, minutes) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const end = new Date(start.getTime() + minutes * 60000);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/* ------------------------ carousel (no deps) ------------------------ */
function Carousel({ images, auto = true, interval = 3500, className = "", heightClasses = "h-80 md:h-96", mode = "cover" }) {
  const [i, setI] = useState(0);
  const timer = useRef(null);
  const touch = useRef({ x: 0, dx: 0 });
  const count = images?.length ?? 0;

  const go = (n) => setI((p) => (count ? (p + n + count) % count : 0));
  const to = (n) => setI(() => (count ? ((n % count) + count) % count : 0));

  useEffect(() => {
    if (!auto || count <= 1) return;
    timer.current = setInterval(() => go(1), interval);
    return () => clearInterval(timer.current);
  }, [count, auto, interval]);

  const pause = () => timer.current && clearInterval(timer.current);
  const resume = () => {
    if (!auto || count <= 1) return;
    pause();
    timer.current = setInterval(() => go(1), interval);
  };

  const onTouchStart = (e) => {
    const t = e.touches?.[0]; if (!t) return;
    touch.current = { x: t.clientX, dx: 0 }; pause();
  };
  const onTouchMove = (e) => {
    const t = e.touches?.[0]; if (!t) return;
    touch.current.dx = t.clientX - touch.current.x;
  };
  const onTouchEnd = () => {
    const { dx } = touch.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    resume();
  };

  if (!count) return null;

  const focusClass = (f) => {
    if (!f) return "object-center";
    const map = { center:"object-center", top:"object-top", bottom:"object-bottom", left:"object-left", right:"object-right" };
    if (map[f]) return map[f];
    if (/^\d+%\s+\d+%$/.test(f)) return `object-[${f.replace(" ", "_")}]`;
    return "object-center";
  };
  const scaleClass = mode === "contain" ? "object-contain bg-stone-900" : "object-cover";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={pause} onMouseLeave={resume}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {images.map((item, idx) => {
          const img = typeof item === "string" ? { src: item } : item;
          return (
            <div key={idx} className="min-w-full">
              <img
                src={img.src}
                alt={`Slide ${idx + 1}`}
                className={`w-full ${heightClasses} ${scaleClass} ${focusClass(img.focus)}`}
              />
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <>
          <button aria-label="Prev" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-800 rounded-full w-9 h-9 grid place-items-center shadow" onClick={() => go(-1)}>‹</button>
          <button aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-800 rounded-full w-9 h-9 grid place-items-center shadow" onClick={() => go(1)}>›</button>
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
            {images.map((_, idx) => (
              <button key={idx} aria-label={`Go to slide ${idx + 1}`} className={`h-2.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-2.5 bg-white/60"}`} onClick={() => to(idx)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------ booking modal ------------------------ */
function BookingModal({ open, onClose, service }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;
  const duration = service?.minutes || 15;
  const price = service?.price || 30;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !time) return;
    const { startISO, endISO } = toISOWithDuration(date, time, duration);
    const title = `${service?.label || "Private lesson"} — Joni Vollenberg`;
    const details = `Rider: ${name}\nEmail: ${email}\nPrice: €${price}\nNotes: ${notes}\n\nBooked from website.`;
    const url = buildGCalCreateUrl({ title, details, location: "", startISO, endISO });
    window.open(url, "_blank");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Book {service?.label}</h3>
          <button onClick={onClose} aria-label="Close" className="text-stone-500 hover:text-stone-700">✕</button>
        </div>
        <form className="p-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Your name</label>
              <input className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" value={name} onChange={(e)=>setName(e.target.value)} required/>
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input type="email" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Date</label>
              <input type="date" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" value={date} onChange={(e)=>setDate(e.target.value)} required/>
            </div>
            <div>
              <label className="text-sm">Start time</label>
              <input type="time" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" value={time} onChange={(e)=>setTime(e.target.value)} required/>
            </div>
          </div>
          <div>
            <label className="text-sm">Notes (optional)</label>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Horse, goals, location…"/>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-600">Duration: {duration} min · Price: €{price}</div>
            <button type="submit" className="px-5 py-2 rounded-xl bg-black text-white hover:bg-stone-800">Add to Google Calendar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------ page ------------------------ */
export default function App() {
  const logoExternal =
    "https://dl.dropboxusercontent.com/scl/fi/r8tfnmvpe9k596b01x6x3/ChatGPT-Image-Aug-21-2025-01_58_35-PM.png?rlkey=xxcob6kk8nni9oc2xrndxsnea&st=ojtgk6yy&raw=1";
  const profileExternal =
    "https://dl.dropboxusercontent.com/scl/fi/vbunsyi8dlvspaqwzkqd8/get.jpg?rlkey=vr237527kmznvt3adk6d9ko86&st=holxsudw&raw=1";

  const gallery = [
    { src: "https://dl.dropboxusercontent.com/scl/fi/6e7fxhz4hlpjokn1hnzdu/520324820_10233846576058961_1063538250687814866_n.jpg?rlkey=7g40pq416bgqppd0yr1mggg6g&st=i5u53nj3&raw=1", focus: "top" },
    { src: "https://dl.dropboxusercontent.com/scl/fi/9mm8mbqh3govstbbwiy37/506635867_10233308082436957_3367148017872899153_n.jpg?rlkey=pd04tooo6ycv4cyumr5ytn32d&st=kx6o2oqc&raw=1", focus: "center" },
    { src: "https://dl.dropboxusercontent.com/scl/fi/4dwbrogx9cg3fuo6nnzc1/531869801_10234143836130277_3674620326781691676_n.jpg?rlkey=096rqt3gciy91iuwwcrnovt98&st=c1yonyqu&raw=1", focus: "50% 30%" },
    { src: "https://dl.dropboxusercontent.com/scl/fi/vbunsyi8dlvspaqwzkqd8/get.jpg?rlkey=vr237527kmznvt3adk6d9ko86&st=holxsudw&raw=1", focus: "center" },
  ];

  const testimonial = {
    heading: "Why My Lessons Are Worth the Investment",
    intro:
      "When you book a lesson, you’re not only paying for training time — you’re investing in years of international competition and coaching experience, proven methods, and a tailored approach for you and your horse.",
    bullets: [
      "Build your confidence and skills step by step",
      "Strengthen the partnership between horse and rider",
      "Provide clear, supportive feedback that accelerates progress",
      "Focus on both enjoyment and performance",
    ],
    outro:
      "✨ Think of it not as a cost, but as an investment in becoming the best version of yourself together with your horse.",
  };

  const services = [
    { key: "15", label: "15 Minutes", minutes: 15, price: 30 },
    { key: "30", label: "30 Minutes", minutes: 30, price: 60 },
  ];
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const openBooking = (key) => {
    const svc = services.find((s) => s.key === key) || services[0];
    setSelectedService(svc); setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* hero */}
      <section className="flex flex-col items-center justify-center py-0 px-2">
        <img src={logoExternal} alt="Joni Vollenberg Logo" className="h-56 w-auto mb-0" />
        <p className="mt-1 max-w-2xl text-center text-lg font-bold text-stone-700">
          Ride Better. Feel Stronger. Go Further.
        </p>
      </section>

      {/* about */}
      <section className="py-12 px-4 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
          <img
            src={profileExternal}
            alt="Joni Vollenberg profile photo"
            className="w-[22rem] h-[26rem] object-cover rounded-2xl shadow-md border border-stone-200"
          />
          <div className="md:w-2/3">
            <h2 className="text-2xl font-semibold tracking-tight">About Me</h2>
            <p className="mt-4 text-lg text-stone-700 leading-relaxed whitespace-pre-line">
              {`I’m Joni Vollenberg, a passionate equestrian and showjumper from the Netherlands. My mission is simple: to help riders of all levels grow in confidence, refine their foundations, and experience the true partnership between horse and rider.

With years of competition and coaching experience, I provide clear, supportive, and effective training — whether you’re just starting out or aiming for advanced goals. Each lesson is fully tailored to you and your horse, with the focus always on progress, trust, and enjoyment.

👉 Ready to take the next step in your riding journey? Book your first lesson with me today.`}
            </p>
          </div>
        </div>
      </section>

      {/* gallery */}
      <section className="py-12 px-4 bg-white">
        <h2 className="text-2xl font-semibold text-center mb-6">Gallery</h2>
        <div className="max-w-5xl mx-auto">
          <Carousel images={gallery} auto interval={3500} heightClasses="h-80 md:h-[28rem]" mode="cover" />
        </div>
      </section>

      {/* testimonial */}
      <section className="py-12 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-center">{testimonial.heading}</h2>
          <div className="mt-6 max-w-3xl mx-auto text-left">
            <p className="text-stone-700 text-lg">{testimonial.intro}</p>
            <ul className="mt-6 space-y-2 text-stone-800 text-base list-disc list-inside">
              {testimonial.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <p className="mt-6 text-stone-700 text-lg">{testimonial.outro}</p>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section className="py-12 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-6">Private Lesson Pricing</h2>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col items-center">
            <h3 className="text-lg font-semibold">15 Minutes</h3>
            <p className="mt-2 text-stone-600">€30</p>
            <button onClick={() => openBooking("15")} className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 transition">Book</button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col items-center">
            <h3 className="text-lg font-semibold">30 Minutes</h3>
            <p className="mt-2 text-stone-600">€60</p>
            <button onClick={() => openBooking("30")} className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 transition">Book</button>
          </div>
        </div>
      </section>

      {/* contact */}
      <section className="py-12 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-6">Contact</h2>
        <p className="text-lg text-stone-700 mb-4">For bookings and inquiries, please reach out via Instagram or email.</p>
        <a href="https://www.instagram.com/jonivollenberg/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Instagram: @jonivollenberg
        </a>
      </section>

      {/* modal */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} service={selectedService} />
    </div>
  );
}
