# Error Codes and what they mean

# Authorization

1002 : Stewardname did not match.
1003 : Access token has expired.
1004 : Failed public key evaluation!
1005 : That public key is not registered.
1006 : Authorization Failed.

# Stewards

1010 : Steward exists with stewardname:
1011 : You already submitted your registration.
1012 : Public key exists:
1013 : A space exists with the name:
1014 : A currency exists with the name:
1015 : Account exists with the name:
1016 : Cannot change your stewardname at this time.
1017 : Cannot change your public key at this time.
1018 : method not implemented at this time.

# Spaces

2001 : Cannot create namespace in the root, your namespace must contain a dot character.
2002 : Parent namespace is not parent of namespace
2003 : Parent namespace does not exist.
2004 : namespace exists with that name.
2005 : Currency exists with that name.
2006 : You are not the steward of this space.
2007 : Account exists with that name.
2008 : Steward does not exist.
2009 : method not implemented at this time.

# Currencies

3001 : Currency exists.
3002 : Space exists with that currency name.

# Accounts

4001 : Account exists with that name.
4002 : Namespace exists with that name.
4003 : Currency exists with that name.
4004 : method not implemented at this time.
4005 : Account namespace does not exist.
4006 : Account currency does not exist.
4007 : Account stewards do not exist.
4008 : You already created this account.
4009 : There is another account with that name.
4010 : Account does not exist.
4011 : You cannot change the currency or currency namespace of an account; Create a new account.
4012 : The public key of this account is not unique.
4013 : You are not the steward of this account.
4014 : Only currency stewards can currency disable account.
4015 : Only namespace stewards can namespace disable account.

# Journals

5002 : From account does not exist.
5003 : You are not the steward of this account.
5004 : Your account is disabled.
5005 : Your account minimum limit will be exceeded by this entry.
5006 : Your account namespace does not exist.
5007 : Your account namespace is disabled.
5008 : Their account does not exist.
5009 : Their account is disabled.
5010 : Their account maximum limit will be exceeded by this entry.
5011 : Their account namespace does not exist.
5012 : Their account namespace is disabled.
5013 : The currency does not exist.
5014 : The currency is disabled.
5015 :