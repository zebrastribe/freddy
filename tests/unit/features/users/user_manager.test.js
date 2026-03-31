/**
 * UserManager Unit Tests (migrated to current Trace admin implementation)
 */

describe('UserManager (trace admin)', () => {
  let UserManager;
  let userManager;
  let firebaseService;
  let adminApp;

  beforeAll(async () => {
    ({ UserManager } = await import('../../../../trace/v2-frontend/src/features/admin/js/components/UserManager.js'));
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="usersContent"></div>';

    firebaseService = {
      getUsers: jest.fn().mockResolvedValue([
        {
          id: 'u1',
          email: 'u1@test.com',
          displayName: 'User One',
          role: 'user',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastLogin: '2025-01-02T00:00:00.000Z'
        },
        {
          id: 'u2',
          email: 'admin@test.com',
          displayName: 'Admin User',
          role: 'admin',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastLogin: '2025-01-03T00:00:00.000Z'
        }
      ]),
      updateUser: jest.fn().mockResolvedValue(undefined)
    };

    adminApp = {
      getService: jest.fn().mockImplementation((name) => {
        if (name === 'firebase') return firebaseService;
        return null;
      }),
      toastService: { show: jest.fn() },
      modalService: { show: jest.fn(), hide: jest.fn() }
    };

    userManager = new UserManager(adminApp);
  });

  test('loads users and renders cards', async () => {
    await userManager.loadUsers();
    expect(firebaseService.getUsers).toHaveBeenCalledTimes(1);
    expect(document.getElementById('usersGrid').innerHTML).toContain('User One');
    expect(document.getElementById('usersGrid').innerHTML).toContain('Admin User');
  });

  test('filters users by search input', async () => {
    await userManager.loadUsers();
    const search = document.getElementById('searchUsers');
    search.value = 'admin';
    userManager.filterUsers();
    expect(document.getElementById('usersGrid').innerHTML).toContain('Admin User');
    expect(document.getElementById('usersGrid').innerHTML).not.toContain('User One');
  });

  test('updateUser persists edited values', async () => {
    userManager.users = [{ id: 'u1', email: 'old@test.com', displayName: 'Old', role: 'user' }];
    document.body.innerHTML = `
      <input id="userEmail_u1" value="new@test.com" />
      <input id="userDisplayName_u1" value="New Name" />
      <select id="userRole_u1"><option value="admin" selected>Admin</option></select>
      <div id="usersGrid"></div>
    `;
    jest.spyOn(userManager, 'renderUsers').mockImplementation(() => {});

    await userManager.updateUser('u1');

    expect(firebaseService.updateUser).toHaveBeenCalledWith('u1', {
      email: 'new@test.com',
      displayName: 'New Name',
      role: 'admin'
    });
    expect(adminApp.toastService.show).toHaveBeenCalledWith('User updated successfully', 'success');
    expect(adminApp.modalService.hide).toHaveBeenCalled();
  });

  test('deleteUser removes user when confirmed', async () => {
    global.confirm = jest.fn().mockReturnValue(true);
    userManager.users = [{ id: 'u1', email: 'u1@test.com', displayName: 'User One', role: 'user' }];
    jest.spyOn(userManager, 'renderUsers').mockImplementation(() => {});

    await userManager.deleteUser('u1');

    expect(userManager.users).toHaveLength(0);
    expect(adminApp.toastService.show).toHaveBeenCalledWith('User deleted successfully', 'success');
  });
});