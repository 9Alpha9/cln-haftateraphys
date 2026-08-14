export function isPublicHost(host: string, publicAppHost: string) {
  const normalizedHost = host.toLowerCase().split(':')[0];
  const normalizedPublicHost = publicAppHost.toLowerCase();

  return (
    Boolean(normalizedPublicHost) &&
    (normalizedHost === normalizedPublicHost || normalizedHost === `www.${normalizedPublicHost}`)
  );
}

export function shouldHideDashboardOnHost(host: string, pathname: string, publicAppHost: string) {
  return isPublicHost(host, publicAppHost) && pathname.startsWith('/dashboard');
}
