export const NavigationStyles = () => {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
body { margin: 0;, padding: 0; }

.navigation-layout {
  & > nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: color-mix(in srgb, yellow 50%, transparent);
    border-bottom: 2px dashed color-mix(in srgb, yellow 90%, black);

    & ul {
      list-style: none;
      display: flex;
      margin: 0;
      padding: 0;
    }

    & li {
      margin-right: 10px;
    }

    & a {
      text-decoration: none;
      color: #333;
      padding: 5px;
      border-bottom: 2px solid transparent;
    }

    & a:hover {
      border-bottom: 2px solid #333;
    }
  }
}`,
      }}
    />
  )
}
