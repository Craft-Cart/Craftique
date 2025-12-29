import { auth0 } from '@/lib/auth0';

export default auth0.withPageAuthRequired(async function Profile() {
  console.log('[Page: Profile] Component mounting');
  const session = await auth0.getSession();
  const user = session?.user;
  console.log('[Page: Profile] User:', user?.email);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.picture && (
            <img
              src={user.picture}
              alt={user?.name || 'Profile'}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Account Details</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="font-medium">User ID:</dt>
                <dd className="text-muted-foreground">{user?.sub}</dd>
              </div>
              {user?.email_verified !== undefined && (
                <div>
                  <dt className="font-medium">Email Verified:</dt>
                  <dd className="text-muted-foreground">
                    {user.email_verified ? 'Yes' : 'No'}
                  </dd>
                </div>
              )}
              {user?.updated_at && (
                <div>
                  <dt className="font-medium">Last Updated:</dt>
                  <dd className="text-muted-foreground">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}, { returnTo: "/profile" });