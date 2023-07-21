import React, { useEffect, useState } from 'react';
import { Flex, Heading, Link, Badge, View } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { getUserDetail } from '../utils/Device';

const Header = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const user = getUserDetail();
    if (user) {
      setUsername(user.username);
    }
  }, []);

  return (
    <>
      <Flex direction="row" justifyContent="space-between" alignContent="center" padding="10px" backgroundColor="#25392B" boxShadow="medium">
        <Heading level="3"><Link href='/' textDecoration="none" color="white">Momento</Link></Heading>
        <Flex
          alignItems="center"
          justifyContent="center"
          borderRadius="xxl"
          backgroundColor="#C4F135"
          width="2.5em"
          height="2.5em"
          style={{cursor: "pointer"}}
          onClick={() => router.push(`/profile${router.pathname == "/" ? '' : "?redirect=" + router.pathname}`)}>
          {username?.charAt(0).toUpperCase()}
        </Flex>
      </Flex>
    </>
  );
};

export default Header;