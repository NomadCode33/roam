import "../../css/legal/privacy.css"

export default function Privacy() {
  return (
    <div className="privacy-page">
      <div className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">Legal · Privacy</span>
          <h1>Privacy Policy of Roam</h1>
          <p>This policy explains what data we collect, why we collect it, and what rights you have over it. We've tried to write it in plain language — not just legal boilerplate.</p>
          <div className="hero-meta">
            <span><strong>Last updated</strong> · July 30, 2026</span>
            <span><strong>Owner</strong> · Roam, Tacoma, WA, USA</span>
            <span><strong>Contact</strong> · nomadcode33@gmail.com</span>
          </div>
        </div>
      </div>

      <div className="page">
        <div className="layout">

          <aside id="table-of-content-wrapper">
          <h2>On this page</h2>
          <ul className="toc-list">
              <li><a href="#summary">Summary</a></li>
              <li><a href="#owner-and-data-controller">Owner &amp; Data Controller</a></li>
              <li><a href="#types-of-data">Types of Data Collected</a></li>
              <li><a href="#mode-and-place">Mode &amp; Place of Processing</a></li>
              <li><a href="#purpose-of-processing">Purposes of Processing</a></li>
              <li><a href="#data_processing_detailed_info">Sub-Processors</a></li>
              <li><a href="#cookie-policy">Cookie Policy</a></li>
              <li><a href="#further-info-eu-users">EU User Rights</a></li>
              <li><a href="#further-info-us-users">US User Rights</a></li>
              <li><a href="#additional-info-on-collection-and-processing">Additional Information</a></li>
              <li><a href="#definitions_and_legal_references">Definitions</a></li>
          </ul>
          </aside>

          <main>

            <section id="summary">
              <h2>Summary</h2>
              <div className="summary-grid">
                <div>
                  <h3 style={{ marginTop: "0" }}>Data we collect automatically</h3>
                  <p>We automatically collect certain data from you when you visit or use Roam.</p>
                  <ul className="pills-list">
                    <li className="pill">Trackers</li>
                    <li className="pill">Usage Data</li>
                    <li className="pill">IP address</li>
                    <li className="pill">Device information</li>
                    <li className="pill">Browser information</li>
                    <li className="pill">Page views</li>
                    <li className="pill">Clicks</li>
                    <li className="pill">Browsing history</li>
                  </ul>
                </div>
                <div>
                  <h3>Trusted third parties that help us process it</h3>
                  <div className="provider-row"><span className="provider-badge">G</span> Google Ireland Limited — registration &amp; authentication</div>
                  <div className="provider-row"><span className="provider-badge">A</span> Apple Inc. — registration &amp; authentication</div>
                  <div className="provider-row"><span className="provider-badge">S</span> Supabase, Inc. — database, auth &amp; storage</div>
                  <div className="provider-row"><span className="provider-badge">M</span> Mapbox Inc. — map display widget</div>
                  <div className="provider-row"><span className="provider-badge">R</span> Resend — transactional email</div>
                  <div className="provider-row"><span className="provider-badge">Se</span> Functional Software, Inc. (Sentry) — error tracking</div>
                  <div className="provider-row"><span className="provider-badge">P</span> PostHog, Inc. — product analytics</div>
                  <div className="provider-row"><span className="provider-badge">G</span> Google Cloud Translation API — machine translation</div>
                </div>
                <div>
                  <h3>How we use it</h3>
                  <ul>
                    <li>Displaying content from external platforms</li>
                    <li>Analytics</li>
                    <li>Registration and authentication</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="owner-and-data-controller">
              <h2>Owner and Data Controller</h2>
              <p><strong>Roam</strong><br />Tacoma, WA, USA</p>
              <p><strong>Owner contact email:</strong> nomadcode33@gmail.com</p>
            </section>

            <section id="types-of-data">
              <h2>Type of Data We Collect</h2>
              <p>Among the types of Personal Data that this Application collects, by itself or through third parties, there are:</p>
              <ul className="pills-list">
                <li className="pill">Trackers</li>
                <li className="pill">Usage Data</li>
                <li className="pill">IP address</li>
                <li className="pill">Device information</li>
                <li className="pill">Browser information</li>
                <li className="pill">Page views</li>
                <li className="pill">Clicks</li>
                <li className="pill">Browsing history</li>
              </ul>
              <p>Complete details on each type of Personal Data collected are provided in the dedicated sections of this privacy policy, or through explanation texts displayed prior to Data collection. Personal Data may be freely provided by the User or, in the case of Usage Data, collected automatically when using this Application.</p>
              <p>Unless specified otherwise, all Data requested by this Application is mandatory, and failure to provide it may make it impossible for this Application to provide its services. Where this Application specifically states that some Data is not mandatory, Users are free not to communicate that Data without consequence to the availability or functioning of the Service.</p>
              <p>Users who are uncertain about which Personal Data is mandatory are welcome to contact the Owner. Any use of Cookies — or of other tracking tools — by this Application or by the owners of third-party services used by this Application serves the purpose of providing the Service required by the User, in addition to any other purposes described in this document and in the Cookie Policy.</p>
              <p>Users are responsible for any third-party Personal Data obtained, published, or shared through this Application.</p>

              <div className="callout">
                <p><strong>Data you provide directly.</strong> In addition to the automatically collected Data above, when you create an account and use Roam we collect the information you explicitly provide: your <strong>email address</strong>, <strong>display name</strong>, <strong>bio</strong>, <strong>avatar image</strong>, <strong>location data</strong> (including place pins you drop or search), and the <strong>posts and comments</strong> you submit.</p>
              </div>

              <div className="callout">
                <p><strong>Community-contributed place data.</strong> Map pins and place data submitted by Users are stored in our <code>places</code> table and may be visible to other Users of the Application as part of Roam's core discovery experience. Do not submit location information you don't want visible to other Users.</p>
              </div>
            </section>

            <section id="mode-and-place">
              <h2>Mode and Place of Processing the Data</h2>
              <h3>Methods of processing</h3>
              <p>The Owner takes appropriate security measures to prevent unauthorized access, disclosure, modification, or unauthorized destruction of the Data. Data processing is carried out using computers and/or IT tools, following organizational procedures strictly related to the purposes indicated. In addition to the Owner, Data may in some cases be accessible to certain types of persons in charge of the operation of this Application (administration, sales, marketing, legal, system administration) or to external parties (technical service providers, mail carriers, hosting providers, IT companies, communications agencies) appointed, where necessary, as Data Processors. An updated list of these parties may be requested from the Owner at any time.</p>
              <h3>Place</h3>
              <p>Data is processed at the Owner's operating offices and in any other places where the parties involved in processing are located. Depending on the User's location, data transfers may involve transferring Data to a country other than their own — see the relevant sections below for details on where transferred Data is processed.</p>
              <h3>Retention time</h3>
              <p>Unless specified otherwise, Personal Data is processed and stored for as long as required by the purpose it was collected for, and may be retained longer where required by law or based on User consent.</p>
            </section>

            <section id="purpose-of-processing">
              <h2>The Purposes of Processing</h2>
              <p>Data concerning the User is collected to allow the Owner to provide its Service, comply with legal obligations, respond to enforcement requests, protect its rights and interests (or those of Users or third parties), detect malicious or fraudulent activity, as well as for the following purposes:</p>
              <ul>
                <li>Displaying content from external platforms</li>
                <li>Analytics</li>
                <li>Registration and authentication</li>
              </ul>

              <div className="callout">
                <p><strong>Specifically, we use your Data to:</strong> personalize your experience and recommendations across the Application; power map-based features such as place discovery, heatmaps, and proximity search; and send you in-app and transactional notifications (for example, account, activity, and verification emails).</p>
              </div>
            </section>

            <section id="data_processing_detailed_info">
              <h2>Detailed Information on the Processing of Personal Data</h2>

              <h3>Analytics</h3>
              <p>These services allow the Owner to monitor and analyze web traffic and can be used to track User behavior.</p>
              <details className="sub-processor">
                <summary>
                  <span>PostHog product analytics<div className="meta-line">PostHog, Inc. · United States</div></span>
                </summary>
                <div className="body">
                  <p>Gives the Owner insight into how Users interact with this Application.</p>
                  <p><strong>Personal Data processed:</strong> browser information, browsing history, clicks, device information, IP address, page views, Trackers.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a></p>
                </div>
              </details>

              <h3>Displaying content from external platforms</h3>
              <p>These services allow you to view content hosted on external platforms directly within this Application and interact with it. They may still collect web traffic data for the pages on which they're installed, even if you don't directly use them.</p>
              <details className="sub-processor">
                <summary>
                  <span>Mapbox Widget<div className="meta-line">Mapbox Inc. · United States</div></span>
                </summary>
                <div className="body">
                  <p>A maps visualization service that allows this Application to display map content.</p>
                  <p><strong>Personal Data processed:</strong> Trackers, Usage Data.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://www.mapbox.com/privacy/" target="_blank" rel="noopener noreferrer">mapbox.com/privacy</a></p>
                </div>
              </details>

              <h3>Registration and authentication</h3>
              <p>By registering or authenticating, Users allow this Application to identify them and give them access to dedicated services. Some registration services may also collect Personal Data for targeting and profiling purposes; see each service's description for details.</p>
              <details className="sub-processor">
                <summary>
                  <span>Google OAuth<div className="meta-line">Google Ireland Limited · Ireland</div></span>
                </summary>
                <div className="body">
                  <p>A registration and authentication service connected to the Google network.</p>
                  <p><strong>Personal Data processed:</strong> Trackers, Usage Data, and other Data specified in the service's privacy policy.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></p>
                </div>
              </details>
              <details className="sub-processor">
                <summary>
                  <span>Sign in with Apple<div className="meta-line">Apple Inc. · United States</div></span>
                </summary>
                <div className="body">
                  <p>A registration and authentication service that lets Users sign in using their Apple ID.</p>
                  <p><strong>Personal Data processed:</strong> Trackers, Usage Data, and identity token data (such as a verified email or private relay address) as specified in Apple's privacy policy.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">apple.com/legal/privacy</a></p>
                </div>
              </details>

              <h3>Infrastructure, hosting, and application services</h3>
              <p>These services store, secure, and operate the core Application on the Owner's behalf.</p>

              <details className="sub-processor">
                <summary>
                  <span>Supabase<div className="meta-line">Supabase, Inc. · United States</div></span>
                </summary>
                <div className="body">
                  <p>Provides the Application's database, authentication, and file storage infrastructure, including the encrypted storage of account, profile, post, and place data described elsewhere in this policy.</p>
                  <p><strong>Personal Data processed:</strong> account and profile data, authentication credentials and tokens, posts, comments, place data, and uploaded media.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></p>
                </div>
              </details>

              <details className="sub-processor">
                <summary>
                  <span>Resend<div className="meta-line">Resend · United States</div></span>
                </summary>
                <div className="body">
                  <p>Delivers transactional email on the Owner's behalf, such as account verification, notifications, and password reset messages.</p>
                  <p><strong>Personal Data processed:</strong> email address, and the content of transactional messages sent to you.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a></p>
                </div>
              </details>

              <details className="sub-processor">
                <summary>
                  <span>Sentry<div className="meta-line">Functional Software, Inc. · United States</div></span>
                </summary>
                <div className="body">
                  <p>Provides error tracking and crash monitoring so the Owner can identify and fix issues with the Application.</p>
                  <p><strong>Personal Data processed:</strong> device and browser information, IP address, and technical logs generated at the time of an error.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">sentry.io/privacy</a></p>
                </div>
              </details>

              <details className="sub-processor">
                <summary>
                  <span>Google Cloud Translation API<div className="meta-line">Google LLC · United States</div></span>
                </summary>
                <div className="body">
                  <p>Provides on-demand machine translation of User-generated content, such as posts and comments, into other languages.</p>
                  <p><strong>Personal Data processed:</strong> text content submitted for translation.</p>
                  <p><strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></p>
                </div>
              </details>
            </section>

            <section id="cookie-policy">
              <h2>Cookie Policy</h2>
              <p>This Application uses Trackers, including cookies and similar local storage technologies, to keep you signed in, remember preferences, and support the analytics and authentication services described above.</p>
              <div className="callout">
                <p><strong>Cookie controls are coming soon.</strong> A dedicated cookie consent banner and preference center is planned for the Application. Until it ships, this section serves as your notice that Trackers are in use; you can control cookies through your browser settings in the meantime.</p>
              </div>
            </section>

            <section id="further-info-eu-users">
              <h2>Further Information for Users in the European Union</h2>
              <h3>Legal basis of processing</h3>
              <p>The Owner may process Personal Data relating to Users if one of the following applies:</p>
              <ul>
                <li>Users have given their consent for one or more specific purposes.</li>
                <li>Provision of Data is necessary for the performance of an agreement with the User and/or for pre-contractual obligations.</li>
                <li>Processing is necessary for compliance with a legal obligation to which the Owner is subject.</li>
                <li>Processing relates to a task carried out in the public interest or in the exercise of official authority vested in the Owner.</li>
                <li>Processing is necessary for the purposes of legitimate interests pursued by the Owner or a third party.</li>
              </ul>
              <p>The Owner will gladly help clarify the specific legal basis that applies to the processing, in particular whether provision of Personal Data is a statutory or contractual requirement, or a requirement necessary to enter into a contract.</p>

              <h3>The rights of Users under the GDPR</h3>
              <p>Users may exercise certain rights regarding their Data processed by the Owner, to the extent permitted by law:</p>
              <ul className="rights-list">
                <li><span className="num">1</span><span><strong>Withdraw consent</strong> at any time, where consent was previously given.</span></li>
                <li><span className="num">2</span><span><strong>Object to processing</strong> carried out on a legal basis other than consent.</span></li>
                <li><span className="num">3</span><span><strong>Access their Data</strong> and obtain a copy of Data undergoing processing.</span></li>
                <li><span className="num">4</span><span><strong>Verify and rectify</strong> the accuracy of their Data.</span></li>
                <li><span className="num">5</span><span><strong>Restrict processing</strong> of their Data.</span></li>
                <li><span className="num">6</span><span><strong>Request erasure</strong> of their Personal Data.</span></li>
                <li><span className="num">7</span><span><strong>Receive and transfer</strong> their Data to another controller.</span></li>
                <li><span className="num">8</span><span><strong>Lodge a complaint</strong> with a competent data protection authority.</span></li>
              </ul>

              <h3>How to exercise these rights</h3>
              <p>Requests can be directed to the Owner via the contact details in this document, free of charge, and will be answered within one month.</p>
            </section>

            <section id="further-info-us-users">
              <h2>Further Information for Users in the United States</h2>
              <p>This section applies to Users residing in California, Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Nevada, Delaware, Iowa, New Hampshire, New Jersey, Nebraska, Tennessee, Minnesota, Maryland, Indiana, Kentucky, Rhode Island, and Montana. For such Users, this section supersedes any conflicting provisions elsewhere in this policy. This part uses the term <strong>Personal Information.</strong></p>

              <h3>Notice at collection</h3>
              <p>The categories of Personal Information collected or disclosed in the past 12 months, so you can exercise meaningful control over our use of that information:</p>

              <table>
                <thead>
                  <tr><th>Category</th><th>Examples</th><th>Sold / Shared</th><th>Targeted Ads</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Internet / network activity</td>
                    <td>Trackers, Usage Data, IP address, device &amp; browser information, page views, clicks, browsing history</td>
                    <td>No</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td>Identifiers</td>
                    <td>Data specified in third-party service privacy policies, Trackers, Usage Data</td>
                    <td>No</td>
                    <td>No</td>
                  </tr>
                </tbody>
              </table>

              <div className="callout">
                <p><strong>We do not sell or share your Personal Information for targeted advertising.</strong> Third parties involved: Mapbox Inc., PostHog, Inc., Google Ireland Limited.</p>
              </div>

              <h3>Your privacy rights under US state laws</h3>
              <p>To the extent permitted by applicable law, you have the right to: know what Personal Information we hold about you, correct inaccurate Personal Information, request deletion, obtain a portable copy, opt out of the sale of your Personal Information, and not be discriminated against for exercising these rights.</p>
              <p>Users in California additionally have the right to opt out of Sharing for cross-context behavioral advertising and to limit use of Sensitive Personal Information. Users in several other states have comparable rights to opt out of targeted advertising, profiling, and to control Sensitive Personal Information consent.</p>

              <h3>How to exercise these rights</h3>
              <p>Submit your request using the contact details in this document. We may need to verify your identity before responding, and will do so without undue delay and within the timeframe required by applicable law.</p>
            </section>

            <section id="additional-info-on-collection-and-processing">
              <h2>Additional Information About Data Collection and Processing</h2>
              <h3>Legal action</h3>
              <p>The User's Personal Data may be used for legal purposes by the Owner in court or in proceedings arising from improper use of this Application. The Owner may be required to disclose Personal Data upon request of public authorities.</p>
              <h3>System logs and maintenance</h3>
              <p>For operation and maintenance purposes, this Application and third-party services may collect files that record interaction with this Application, or use other Personal Data such as IP address, for this purpose.</p>
              <h3>Changes to this privacy policy</h3>
              <p>The Owner reserves the right to make changes to this privacy policy at any time, by notifying Users on this page and, where technically and legally feasible, sending a notice via any contact information available to the Owner. Where changes affect processing activities based on consent, the Owner will collect new consent where required.</p>
            </section>

            <section id="definitions_and_legal_references">
              <h2>Definitions and Legal References</h2>
              <h3>Personal Data (or Data) / Personal Information</h3>
              <p>Any information that directly, indirectly, or in connection with other information — including a personal identification number — allows for the identification of a natural person.</p>
              <h3>Usage Data</h3>
              <p>Information collected automatically through this Application, which can include IP addresses, URIs, request timestamps, response codes, country of origin, browser and OS details, time spent per page, and navigation paths.</p>
              <h3>Data Controller (or Owner)</h3>
              <p>The natural or legal person who, alone or jointly with others, determines the purposes and means of processing Personal Data, including the security measures for this Application. Unless otherwise specified, the Data Controller is the Owner of this Application.</p>
              <h3>Tracker</h3>
              <p>Any technology — e.g. Cookies, unique identifiers, web beacons, embedded scripts, e-tags, and fingerprinting — that enables the tracking of Users, for example by accessing or storing information on the User's device.</p>

              <div className="callout">
                <p><strong>Data deletion.</strong> You can request deletion of your account and associated Personal Data at any time using the contact details in this document. A self-service account deletion flow within the Application is planned; until it ships, deletion requests are handled manually by the Owner and will be completed within the timeframe required by applicable law.</p>
              </div>

              <div className="action-grid">
                <a className="action-card" href="mailto:nomadcode33@gmail.com?subject=Right%20of%20access">Request access to your data →</a>
                <a className="action-card" href="mailto:nomadcode33@gmail.com?subject=Right%20to%20rectification">Correct your data →</a>
                <a className="action-card" href="mailto:nomadcode33@gmail.com?subject=Right%20to%20be%20forgotten">Request deletion →</a>
                <a className="action-card" href="mailto:nomadcode33@gmail.com?subject=Right%20to%20data%20portability">Export your data →</a>
              </div>
            </section>

          </main>
        </div>
      </div>

      <footer className="doc-footer">
        <p>Roam · Tacoma, WA, USA · <a href="mailto:nomadcode33@gmail.com">nomadcode33@gmail.com</a></p>
      </footer>
    </div>
  );
}