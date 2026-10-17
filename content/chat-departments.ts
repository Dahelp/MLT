export function publicChatDepartment(path:string):"sales"|"concierge" {return /^\/(?:en|de|ru|it|pl)\/(?:acquisitions|investments)(?:\/|$)/.test(path)?"sales":"concierge"}
