export function publicChatDepartment(path:string):"sales"|"concierge" {return /^\/(?:en|de|ru|it|pl)\/(?:acquisitions|investments)(?:\/|$)/.test(path)?"sales":"concierge"}
export function publicChatTopic(path:string):"sales"|"investments"|"concierge" {return /^\/(?:en|de|ru|it|pl)\/investments(?:\/|$)/.test(path)?"investments":publicChatDepartment(path)}
