import { siteIdentity } from "../content/site";

export default function ContactSocialLinks() {
  return (
    <div className="mlt-contact-socials">
      <a href={siteIdentity.facebookHref} aria-label="Facebook Messenger MLT" title="Facebook Messenger" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M14 21v-8h2.8l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.8v3h2.8v8Z"/>
        </svg>
      </a>
      <a href={siteIdentity.telegramHref} aria-label="Telegram MLT" title="Telegram" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m20.7 4.2-3.1 15.1c-.2 1.1-.9 1.4-1.8.9l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L5.5 13.3.9 11.9c-1-.3-1-1 .2-1.5L19 3.5c.8-.3 1.9.2 1.7.7Z" transform="translate(1 0)"/>
        </svg>
      </a>
      <a href={siteIdentity.whatsappHref} aria-label="WhatsApp MLT" title="WhatsApp" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fillRule="evenodd" d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.3 15.2l-.3-.2-2.9.8.8-2.8-.2-.4A8.2 8.2 0 0 1 12 3.8Z"/>
          <path d="M9.2 7.2c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.6-.7 1.8-1.3.2-.7.2-1.2.1-1.3-.1-.1-.3-.2-.7-.4l-1.9-.9c-.3-.1-.5-.2-.7.2l-.9 1c-.2.2-.3.2-.7 0a7.8 7.8 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.7-1.8Z"/>
        </svg>
      </a>
    </div>
  );
}
