import React from "react";
import "../styles/PricingPage.css";

const plans = [
  {
    name: "Starter",
    price: "$250",
    description:
      "A simple, polished website package for landing pages, personal brands, portfolios, and small businesses that need a clean online presence.",
    features: [
      "1–3 pages",
      "Mobile responsive layout",
      "Basic custom design styling",
      "Contact section or simple form",
      "HTML, CSS, and light JavaScript",
      "1 revision round",
    ],
  },
  {
    name: "Growth",
    price: "$650",
    description: "Best for small businesses and creators.",
    features: [
      "4–7 pages",
      "Custom layout sections",
      "Responsive Design across devices",
      "Contact forms and integrations",
      "Basic SEO structure",
      "Navigation structure planning",
      "Performance optimization",
      "2 revisions",
    ],
    featured: true,
  },
  {
    name: "Professional",
    price: "$1,000 - $2,500",
    description: "Advanced business sites or full web applications.",
    features: [
      "8–15 pages or complex app structure",
      "Full custom UI/UX design (no templates)",
      "Dynamic data (APIs, dashboards, user systems)",
      "Authentication (login/signup)",
      "Database integration (Supabase / PostgreSQL)",
      "CMS or admin panel (optional)",
      "Analytics setup",
      "Performance optimization",
      "SEO optimization",
      "Deployment + hosting setup",
      "2–3 weeks post-launch support",
    ],
  },
  {
    name: "Custom",
    price: "Quote",
    description:
      "Custom-built web apps, advanced features, and full-stack systems tailored to your project.",
    features: [
      "Custom dashboards and admin systems",
      "Authentication and user account systems",
      "Database integrations",
      "AI-powered features and automations",
      "Full-stack development",
      "API integrations",
      "Custom business logic",
      "Built with modern frontend and backend tools",
    ],
  },
];

const services = [
  {
    title: "Full-Stack Web Development",
    description:
      "Custom web applications built with modern frameworks like React, Node.js, and Supabase. Ideal for dashboards, SaaS platforms, and scalable online products.",
  },
  {
    title: "Backend & API Development",
    description:
      "Secure backend systems using Node.js and database platforms like Supabase or PostgreSQL. Includes authentication systems, APIs, analytics tracking, and data management.",
  },
  {
    title: "Web App Software Engineering",
    description:
      "Advanced web applications including dashboards, admin systems, SaaS tools, analytics platforms, and custom business software.",
  },
  {
    title: "AI Integration",
    description:
      "AI-powered features including chatbots, automation tools, recommendation systems, and integrations with modern AI platforms.",
  },
  {
    title: "Portfolio & Business Websites",
    description:
      "Professional websites for small businesses, creators, and personal brands designed to convert visitors into clients.",
  },
];

export default function PricingPage() {
  return (
    <div className="pricingPage">
      <div className="pricingHeader"></div>

      <section className="servicesSection dp-transSurface">
        <h2 className="servicesTitle">
          Web Development & Software Engineering Services
        </h2>

        <p className="servicesIntro">
          I’m a full-stack web developer and software engineer specializing in
          modern websites and scalable web applications built with the MERN stack
          and Supabase. With a background in art and design, I apply color
          theory, layout, and visual balance to create interfaces that are both
          technically robust and visually compelling.
        </p>

        <div className="servicesGrid">
          {services.map((service) => (
            <div key={service.title} className="serviceCard">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricingSection">
        <aside className="waitlistCard dp-transSurface">
          <div className="waitlistBadge">Limited Availability</div>

          <h3 className="waitlistTitle">Taking 1–2 projects at a time.</h3>

          <p className="waitlistText">
            I currently take on only 1–2 client projects at once so every build
            gets proper focus, communication, and polish.
          </p>

          <div className="depositBox">
            <div className="depositTitle">Project Policy</div>
            <p className="depositText">
              A <strong>50% upfront deposit</strong> is required before project
              work begins. This secures your slot and protects production time.
            </p>
          </div>

          <ul className="waitlistList">
            <li>Focused delivery</li>
            <li>Clear communication</li>
            <li>Managed project load</li>
            <li>Higher quality work</li>
          </ul>

          <a
            className="waitlistCTA"
            href={`mailto:maxwellpearl90@gmail.com?subject=${encodeURIComponent(
              "Waitlist Inquiry"
            )}&body=${encodeURIComponent(
              "Hi Jayden,\n\nI'd like to join your project waitlist.\n\nProject type:\nTimeline:\nBudget:\n"
            )}`}
          >
            Join Waitlist
          </a>
        </aside>

        <div className="pricingGrid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricingCard dp-transSurface ${
                plan.featured ? "pricingFeatured" : ""
              }`}
            >
              <h3 className="planName">{plan.name}</h3>

              <div className="planPrice">{plan.price}</div>

              <div className="planDescription">{plan.description}</div>

              <ul className="planList">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <a
                className="planCTA"
                href={`mailto:maxwellpearl90@gmail.com?subject=${encodeURIComponent(
                  `${plan.name} Plan Inquiry`
                )}&body=${encodeURIComponent(
                  `Hi Jayden,\n\nI'm interested in the ${plan.name} plan.\n\nProject details:\nTimeline:\nBudget:\n`
                )}`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}