import type {StaffLocale} from '../../content/operations-navigation';
import {teamMarketingCopy} from '../../content/team-access';
import './team-marketing-access.css';

export default function TeamMarketingAccess({locale,assigned}:{locale:StaffLocale;assigned:boolean}){
 const t=teamMarketingCopy[locale];
 return <section className="team-marketing-access" aria-labelledby="team-marketing-title"><div><h3 id="team-marketing-title">{t.title}</h3><p><strong>{assigned?t.assigned:t.empty}</strong> {t.hint}</p></div><nav aria-label={t.title}><a className="team-marketing-create" href="/admin/users/?create=marketer">{t.create}</a><a href="/admin/users/">{t.existing}</a></nav></section>;
}
