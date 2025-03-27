let user = null;
export const setUser = (u) => {
  user = u;
  if (sessionStorage) sessionStorage.setItem('lovenian-user', JSON.stringify(user));
};
export const getUser = () => {
  if (user) return user;
  if (sessionStorage) {
    user = JSON.parse(sessionStorage.getItem('lovenian-user'));
    return user;
  }
  return null;
};
